import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { SpotifyTrack, Track as BaseTrack } from "@/types/track";
// Locally redefine Track type for this file, omitting 'id'
type Track = Omit<BaseTrack, "id">;
const EXPORT_DIR = path.resolve(process.cwd(), "spotify_exports");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper function to get friend_id by username
async function getFriendIdByUsername(username: string): Promise<number> {
  const result = await pool.query('SELECT id FROM friends WHERE username = $1', [username]);
  if (result.rows.length === 0) {
    throw new Error(`Friend not found for username: ${username}`);
  }
  return result.rows[0].id;
}

// --- Converter function ---
/**
 * Convert one SpotifyTrack into your internal Track shape.
 *
 * @param spotifyTrack  the raw object from Spotify’s API
 * @param username      the local username to stamp on this record
 */
function spotifyToTrack(spotifyTrack: SpotifyTrack, username: string, friendId?: number): Track {
  const t = spotifyTrack.track;

  // 1) Year → parse from release_date (first 4 chars)
  let year: number | null = null;
  if (t.album.release_date && t.album.release_date.length >= 4) {
    const y = parseInt(t.album.release_date.slice(0, 4), 10);
    if (!isNaN(y)) year = y;
  }

  // 2) Duration formatting
  const durationSeconds =
    typeof t.duration_ms === "number" ? Math.floor(t.duration_ms / 1000) : null;

  const duration =
    durationSeconds !== null
      ? `${Math.floor(durationSeconds / 60)}:${String(
          durationSeconds % 60
        ).padStart(2, "0")}`
      : null;

  // 3) Build the Track
  return {
    track_id: t.id,
    title: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    album: t.album.name,
    year: year !== null ? year : "",
    styles: [], // Spotify doesn’t expose “styles”
    genres: [], // neither does it expose “genres” at track level
    duration: duration !== null ? duration : "",
    discogs_url: "", // no Discogs link from Spotify
    album_thumbnail: t.album.images.length > 0 ? t.album.images[0].url : undefined,
    position: t.track_number,
    duration_seconds: durationSeconds !== null ? durationSeconds : undefined,
    bpm: null, // Spotify’s audio-features endpoint has BPM, but not here
    key: null, // likewise, you'd need a separate call for key
    notes: null, // you can fill this in later if you like
    local_tags: "", // your tags, not provided by Spotify
    apple_music_url: "", // you'd need a separate lookup
    local_audio_url: t.preview_url !== null ? t.preview_url : undefined,
    username,
    friend_id: friendId ?? (() => { throw new Error('friend_id is required for track creation') })(),
    spotify_url: t.external_urls.spotify || "", // Spotify URL
  };
}

export async function POST() {
  try {
    const { getMeiliClient } = await import("@/lib/meili");
    const meiliClient = getMeiliClient();
    // Process all manifest files for all usernames
    const manifestFiles = fs.readdirSync(EXPORT_DIR).filter(f => f.startsWith("manifest_") && f.endsWith(".json"));
    const allTracks: Track[] = [];
    const errors: { file: string; error: string }[] = [];
    for (const manifestFile of manifestFiles) {
      let manifestUsername = manifestFile.replace(/^manifest_(.+)\.json$/, "$1");
      try {
        const manifestRaw = fs.readFileSync(path.join(EXPORT_DIR, manifestFile), "utf-8");
        const manifest = JSON.parse(manifestRaw);
        if (manifest.spotifyUsername && typeof manifest.spotifyUsername === "string") {
          manifestUsername = manifest.spotifyUsername;
        }
        // For each trackId in manifest, load the track file
        for (const trackId of manifest.trackIds || []) {
          try {
            const trackFile = path.join(EXPORT_DIR, `track_${trackId}.json`);
            if (!fs.existsSync(trackFile)) continue;
            const raw = fs.readFileSync(trackFile, "utf-8");
            const spotifyTrack = JSON.parse(raw);
            const friendId = await getFriendIdByUsername(manifestUsername);
            const track = spotifyToTrack(spotifyTrack, manifestUsername, friendId);
            allTracks.push(track);
          } catch (e) {
            errors.push({ file: `track_${trackId}.json`, error: (e as Error).message });
          }
        }
      } catch (e) {
        errors.push({ file: manifestFile, error: (e as Error).message });
      }
    }
    if (!allTracks.length) {
      return NextResponse.json(
        { error: "No Spotify track files found in any manifest" },
        { status: 404 }
      );
    }
    // Upsert tracks into DB
    const upserted: Track[] = [];
    for (const [i, track] of allTracks.entries()) {
      if (i % 100 === 0)
        console.log(
          `[Spotify Index] Upserting track ${i + 1}/${allTracks.length}`
        );
      await pool.query(
        `
      INSERT INTO tracks (
        track_id, title, artist, album, year, styles, genres, duration, position, discogs_url, album_thumbnail, bpm, key, notes, local_tags, apple_music_url, duration_seconds, username, local_audio_url, spotify_url
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
      )
      ON CONFLICT (track_id, username) DO UPDATE SET
        username = EXCLUDED.username,
        spotify_url = EXCLUDED.spotify_url
      RETURNING *
      `,
        [
          track.track_id,
          track.title,
          track.artist,
          track.album,
          track.year,
          track.styles,
          track.genres,
          track.duration,
          track.position,
          track.discogs_url,
          track.album_thumbnail,
          track.bpm,
          track.key,
          track.notes,
          track.local_tags,
          track.apple_music_url,
          track.duration_seconds,
          track.username,
          track.local_audio_url,
          track.spotify_url,
        ]
      );
      const { rows } = await pool.query(
        "SELECT * FROM tracks WHERE track_id = $1 AND username = $2",
        [track.track_id, track.username]
      );
      if (rows && rows[0]) {
        upserted.push(rows[0]);
      }
    }
    // Index in MeiliSearch
    const index = await meiliClient.index("tracks");
    const { taskUid } = await index.addDocuments(
      upserted.map((t) => ({
        ...t,
        notes: t.notes ? t.notes : null,
        local_tags: t.local_tags ? t.local_tags : [],
        _vectors: { default: null },
        hasVectors: false,
      }))
    );
    console.log(
      `🚀 Added ${upserted.length} Spotify tracks to MeiliSearch (task UID: ${taskUid})`
    );
    return NextResponse.json({
      message: `Upserted and indexed ${upserted.length} Spotify tracks.`,
      errors,
      totalFiles: manifestFiles.length,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
