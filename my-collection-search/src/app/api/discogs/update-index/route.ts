import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { Index, MeiliSearch } from "meilisearch";

const DISCOGS_EXPORTS_DIR = path.resolve(process.cwd(), "discogs_exports");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface DiscogsRelease {
  id: string;
  title: string;
  artists: { name: string }[];
  artists_sort?: string;
  year: number;
  styles: string[];
  genres: string[];
  uri: string;
  thumb: string;
  tracklist: {
    position: string;
    title: string;
    duration: string;
    artists: { name: string }[];
  }[];
}

interface Track {
  track_id: string;
  title: string;
  artist: string;
  album: string;
  year: number | null;
  styles: string[];
  genres: string[];
  duration: string;
  discogs_url: string;
  album_thumbnail: string;
  position: string;
  duration_seconds: number | null;
  bpm: number | null;
  key: string | null;
  notes: string | null;
  local_tags: string[];
  apple_music_url: string | null;
  local_audio_url: string | null;
  username: string;
}

interface Artist {
  name: string;
}

interface ProcessedTrack {
  position: string;
  title: string;
  duration: string;
  artists: Artist[];
  duration_seconds?: number | null;
  apple_music_url?: string | null;
  local_audio_url?: string | null;
}

async function getOrCreateTracksIndex(
  meiliClient: MeiliSearch
): Promise<Index> {
  try {
    console.log('[MeiliSearch] Attempting to get index "tracks"...');
    const idx = await meiliClient.getIndex("tracks");
    console.log('[MeiliSearch] Index "tracks" exists.');
    return idx;
  } catch (err) {
    console.log("[MeiliSearch] Error getting index:", err);
    console.log(
      '[MeiliSearch] Index not found, creating index "tracks" with primaryKey "id"...'
    );
    await meiliClient.createIndex("tracks", { primaryKey: "id" });
    console.log(
      '[MeiliSearch] Index "tracks" created. Fetching index object...'
    );
    return meiliClient.index("tracks");
  }
}

export async function POST() {
  try {
    const { getMeiliClient } = await import("@/lib/meili");
    const meiliClient = getMeiliClient({ server: true });
    if (!fs.existsSync(DISCOGS_EXPORTS_DIR)) {
      return NextResponse.json(
        { error: "discogs_exports directory not found" },
        { status: 404 }
      );
    }
    // Gather all manifest_*.json files to get per-user releases
    const manifestFiles = fs
      .readdirSync(DISCOGS_EXPORTS_DIR)
      .filter((f) => /^manifest_.+\.json$/.test(f));
    if (!manifestFiles.length) {
      return NextResponse.json(
        { error: "No manifest JSON files found in discogs_exports" },
        { status: 404 }
      );
    }

    const allTracks: Track[] = [];
    for (const manifestFile of manifestFiles) {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(DISCOGS_EXPORTS_DIR, manifestFile), "utf-8")
      );
      const username =
        manifest.username || manifestFile.replace(/^manifest_|\.json$/g, "");
      console.log(
        `[Discogs Index] Processing manifest for user: ${username} (${manifestFile})`
      );
      // console.log(`[Discogs Index] Manifest content: ${JSON.stringify(manifest, null, 2)}`);
      // Ensure manifest has releases
      const releaseFiles = manifest.releaseIds || [];
      console.log(
        `[Discogs Index] Found ${releaseFiles.length} release files for user: ${username}`
      );
      for (const releaseFile of releaseFiles) {
        // console.log(
        //   `[Discogs Index] Processing release file: ${releaseFile} for user: ${username}`
        // );
        // Support username-prefixed files for friends' collections
        let releasePath = path.join(
          DISCOGS_EXPORTS_DIR,
          `release_${releaseFile}.json`
        );
        if (
          !fs.existsSync(releasePath) &&
          username &&
          process.env.DISCOGS_USERNAME &&
          username !== process.env.DISCOGS_USERNAME
        ) {
          // Try username-prefixed file if not the main user
          const altPath = path.join(
            DISCOGS_EXPORTS_DIR,
            `${username}_release_${releaseFile}.json`
          );
          if (fs.existsSync(altPath)) {
            releasePath = altPath;
          }
        }
        // console.log(`[Discogs Index] Checking release path: ${releasePath}`);
        if (!fs.existsSync(releasePath)) continue;
        const album = JSON.parse(
          fs.readFileSync(releasePath, "utf-8")
        ) as DiscogsRelease;
        const artist_name =
          album["artists_sort"] ||
          (album.artists && album.artists[0] && album.artists[0].name) ||
          "Unknown Artist";
        const album_title = album["title"];
        const album_year = album["year"];
        const album_styles = album["styles"] || [];
        const album_genres = album["genres"] || [];
        const discogs_url = album["uri"];
        const thumbnail = album["thumb"];
        (album["tracklist"] || []).forEach((track: ProcessedTrack) => {
          let track_id = `${album["id"]}-${track["position"]}`;
          // Clean track_id: remove spaces and enforce valid characters only
          track_id = track_id.trim().replace(/[^a-zA-Z0-9\-_]/g, "");
          allTracks.push({
            track_id,
            title: track["title"],
            artist: track["artists"]
              ? track["artists"].map((a: Artist) => a.name).join(", ")
              : artist_name,
            album: album_title,
            year: album_year,
            styles: album_styles,
            genres: album_genres,
            duration: track["duration"],
            discogs_url: discogs_url,
            album_thumbnail: thumbnail,
            position: track["position"] || "",
            duration_seconds: track["duration_seconds"] || null,
            bpm: null,
            key: null,
            notes: null,
            local_tags: [],
            apple_music_url: track["apple_music_url"] || null,
            local_audio_url: track["local_audio_url"] || null,
            username,
          });
          // console.log(
          //   `[Discogs Index] Prepared track: ${track_id} - ${track["title"]} (user: ${username})`
          // );
        });
      }
    }
    console.log(`[Discogs Index] Total tracks to upsert: ${allTracks.length}`);
    // Always get or create the index using .index(), which is safe and idempotent
    const index = await getOrCreateTracksIndex(meiliClient);
    // Set vector settings for the embedding field (MeiliSearch v1.7+)
    // Set embedders for userProvided vectors (MeiliSearch v1.7+)
    try {
      const embedderRes = await fetch(
        `${meiliClient.config.host}/indexes/tracks/settings/embedders`,
        {
          method: "PATCH",
          headers: new Headers({
            "Authorization": `Bearer ${meiliClient.config.apiKey ?? ""}`,
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            default: {
              source: "userProvided",
              dimensions: 1536
            }
          }),
        }
      );
      if (!embedderRes.ok) {
        console.warn("Failed to set MeiliSearch embedders:", await embedderRes.text());
      } else {
        console.log("MeiliSearch embedders updated for userProvided vectors.", embedderRes);
      }
    } catch (err) {
      console.warn("Error setting MeiliSearch embedders:", err);
    }

    const upserted: Record<string, ProcessedTrack>[] = [];
    for (const [i, track] of allTracks.entries()) {
      if (i % 100 === 0)
        console.log(
          `[Discogs Index] Upserting track ${i + 1}/${allTracks.length}`
        );
      // Upsert track, but only update username on conflict
      await pool.query(
        `
      INSERT INTO tracks (
        track_id, title, artist, album, year, styles, genres, duration, position, discogs_url, album_thumbnail, bpm, key, notes, local_tags, apple_music_url, duration_seconds, username
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      )
      ON CONFLICT (track_id) DO UPDATE SET
        username = EXCLUDED.username
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
        ]
      );
      // Fetch the full row from the DB to get all fields (including custom fields)
      const { rows } = await pool.query(
        "SELECT * FROM tracks WHERE track_id = $1",
        [track.track_id]
      );
      if (rows && rows[0]) {
        upserted.push(rows[0]);
        // console.debug(JSON.stringify(rows[0], null, 2));
      }
    }

    await index.updateSearchableAttributes([
      "title",
      "artist",
      "album",
      "local_tags",
      "styles",
      "genres",
      "notes",
      "username",
    ]);
    // using meilisearch-js
    await index.updateFilterableAttributes([
      "title",
      "artist",
      "album",
      "bpm",
      "genres",
      "key",
      "local_tags",
      "styles",
      "year",
      "track_id",
      "local_audio_url",
      "username",
      "notes",
      "apple_music_url",
      "youtube_url",
      "hasVectors",
    ]);
    console.log(
      `[Discogs Index] Adding ${upserted.length} tracks to MeiliSearch index...`
    );

    // Write upserted tracks to a JSON file for debugging
    // fs.writeFileSync(
    //   path.join(DISCOGS_EXPORTS_DIR, "debug_upserted_tracks.json"),
    //   JSON.stringify(upserted, null, 2),
    //   "utf-8"
    // );
    const { taskUid } = await index.addDocuments(
      upserted.map((t) => {
        // Remove embedding, keep _vectors as array
        const { embedding, ...rest } = t;
        let vectorArr = null;
        if (embedding) {
          if (Array.isArray(embedding)) {
            vectorArr = embedding;
          } else if (typeof embedding === "string") {
            try {
              vectorArr = JSON.parse(embedding);
            } catch {
              vectorArr = null;
            }
          }
        }
        return {
          ...rest,
          notes: t.notes ? t.notes : null,
          local_tags: t.local_tags ? t.local_tags : [],
          _vectors: { default: vectorArr },
          hasVectors: vectorArr ? true : false,
        };
      })
    );

    console.log(
      `🚀 Added ${upserted.length} tracks to MeiliSearch (task UID: ${taskUid})`
    );

    // await index.waitForTask(task.taskUid);
    console.log(
      `[Discogs Index] Done. Upserted and indexed ${upserted.length} tracks.`
    );

    return NextResponse.json({
      message: `Upserted and indexed ${upserted.length} tracks from discogs_exports.`,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
