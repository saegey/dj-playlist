// import_playlist_from_xml.js
// Usage: node import_playlist_from_xml.js <path-to-xml> <playlist-name>

const fs = require("fs");
const plist = require("plist");

const dotenv = require('dotenv');
dotenv.config();

const { MeiliSearch } = require('meilisearch');

// Optionally keep Postgres for playlist insert, but not for track lookup
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const meiliClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || undefined,
});
const tracksIndex = meiliClient.index('tracks');

async function importAppleMusicPlaylist(xmlPath, playlistName) {
  const xml = fs.readFileSync(xmlPath, "utf-8");
  const data = plist.parse(xml);
  const rootDict = data;

  // --- Tracks section ---
  // Apple XML: rootDict["Tracks"] is a dict: { trackId: { ...track metadata... }, ... }
  const tracksObj = rootDict["Tracks"] || {};
  const trackEntries = Object.entries(tracksObj).filter(([k, v]) => v && typeof v === 'object');
  console.log(`📂 Found ${trackEntries.length} tracks in XML.`);

  // Build map: Track ID => Persistent ID
  const trackIdToPersistentId = {};
  const trackIdToMetadata = {};
  for (const [trackId, trackDict] of trackEntries) {
    let persistentId = null;
    if (trackDict["Persistent ID"]) persistentId = trackDict["Persistent ID"];
    trackIdToPersistentId[trackId] = persistentId;
    trackIdToMetadata[trackId] = trackDict;
  }

  // --- Playlists section ---
  // Apple XML: rootDict["Playlists"] is an array or a single object
  let playlistsArr = rootDict["Playlists"];
  if (!Array.isArray(playlistsArr)) {
    playlistsArr = playlistsArr ? [playlistsArr] : [];
  }
  console.log(`📂 Found ${playlistsArr.length} playlists in XML.`);


  // Find playlist by name or Playlist ID
  let playlist = playlistsArr.find((p) => {
    if (p["Name"] && p["Name"] === playlistName) return true;
    if (p["Playlist ID"] && String(p["Playlist ID"]) === String(playlistName)) return true;
    return false;
  });
  console.log(`🔍 Searching for playlist '${playlistName}'...`);
  if (!playlist) {
    console.log(`ℹ️ Playlist '${playlistName}' not found in XML, creating new empty playlist.`);
    playlist = { "Name": playlistName, "Playlist Items": [] };
  }

  // Extract Track IDs from Playlist Items (Apple Music XML structure)
  let playlistItems = [];
  if (playlist["Playlist Items"] && playlist["Playlist Items"].array) {
    // Standard Apple XML: array of dicts
    playlistItems = playlist["Playlist Items"].array;
  } else if (Array.isArray(playlist["Playlist Items"])) {
    playlistItems = playlist["Playlist Items"];
  }
  // Defensive: flatten if needed
  if (!Array.isArray(playlistItems)) {
    playlistItems = [playlistItems];
  }
  playlistItems = playlistItems.filter(Boolean);

  console.log(`📋 Found ${playlistItems.length} items in playlist '${playlistName}'.`);

  // Extract Track IDs
  const playlistTrackIds = playlistItems.map((item) => {
    if (item && item["Track ID"]) {
      return String(item["Track ID"]);
    }
    return null;
  }).filter((tid) => tid !== null && tid !== undefined);
  console.log(`📋 Found ${playlistTrackIds.length} tracks in playlist '${playlistName}'.`);



  // Try to match by Persistent ID, but if not available, fall back to metadata matching using MeiliSearch
  const foundTracks = [];
  for (const tid of playlistTrackIds) {
    let trackRow = null;
    // const persistentId = trackIdToPersistentId[tid];
    // if (persistentId) {
    //   // Try persistent ID match in MeiliSearch (if indexed)
    //   const search = await tracksIndex.search(persistentId, { filter: `apple_music_persistent_id = \"${persistentId}\"` });
    //   if (search.hits && search.hits.length) {
    //     trackRow = search.hits[0];
    //   }
    // }
    if (!trackRow) {
      // Fallback: try to match by title, artist, album
      const trackEntry = trackIdToMetadata[tid];
      console.log(`🔍 Searching for track with ID ${tid}...`);
      if (trackEntry) {
        const title = trackEntry["Name"] || null;
        const artist = trackEntry["Artist"] || null;
        const album = trackEntry["Album"] || null;
        if (title && artist) {
          // Build MeiliSearch query string
          let query = `${title} ${artist}`;
          if (album) query += ` ${album}`;
          try {
            const search = await tracksIndex.search(query, {
              limit: 5
            });
            console.log(`🔍 MeiliSearch found ${search.hits.length} possible tracks.`);
            // Find best match by comparing fields (case-insensitive, trimmed)
            const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
            const normTitle = norm(title);
            const normArtist = norm(artist);
            const normAlbum = album ? norm(album) : null;
            trackRow = search.hits.find(hit => {
              if (norm(hit.title) !== normTitle) return false;
              if (norm(hit.artist) !== normArtist) return false;
              if (normAlbum && hit.album && norm(hit.album) !== normAlbum) return false;
              return true;
            }) || null;
            if (!trackRow && search.hits.length) {
              // fallback: take first hit if nothing matches exactly
              trackRow = search.hits[0];
            }
          } catch (err) {
            console.error('MeiliSearch error:', err.message);
          }
        }
      }
    }
    if (trackRow) foundTracks.push(trackRow);
  }

  if (foundTracks.length) {
    await pool.query("INSERT INTO playlists (name, tracks) VALUES ($1, $2)", [
      playlistName,
      JSON.stringify(foundTracks),
    ]);
    console.log(`✅ Imported playlist '${playlistName}' with ${foundTracks.length} tracks.`);
  } else {
    console.log("⚠️ No matching tracks found for this playlist.");
  }
  await pool.end();
}

if (require.main === module) {
  const [, , xmlPath, playlistName] = process.argv;
  if (!xmlPath || !playlistName) {
    console.error("Usage: node import_playlist_from_xml.js <path-to-xml> <playlist-name>");
    process.exit(1);
  }
  importAppleMusicPlaylist(xmlPath, playlistName).catch((err) => {
    console.error("❌ Import failed:", err);
    process.exit(1);
  });
}