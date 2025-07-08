import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { MeiliSearch } from "meilisearch";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const DISCOGS_EXPORTS_DIR = path.resolve(process.cwd(), "discogs_exports");
const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://127.0.0.1:7700",
  apiKey: process.env.MEILISEARCH_API_KEY || "masterKey",
});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST() {
  try {
    if (!fs.existsSync(DISCOGS_EXPORTS_DIR)) {
      return NextResponse.json(
        { error: "discogs_exports directory not found" },
        { status: 404 }
      );
    }
    // Gather all release_*.json and release_*_updated.json files
    const files = fs
      .readdirSync(DISCOGS_EXPORTS_DIR)
      .filter((f) => /^release_\d+(?:_updated)?\.json$/.test(f));
    console.log(
      `[Discogs Index] Found ${files.length} release JSON files in discogs_exports.`
    );
    if (!files.length) {
      return NextResponse.json(
        { error: "No release JSON files found in discogs_exports" },
        { status: 404 }
      );
    }
    let allTracks = [];
    for (const file of files) {
      console.log(`[Discogs Index] Processing album file: ${file}`);
      const album = JSON.parse(
        fs.readFileSync(path.join(DISCOGS_EXPORTS_DIR, file), "utf-8")
      );
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
      (album["tracklist"] || []).forEach((track) => {
        let track_id = `${album["id"]}-${track["position"]}`;
        // Clean track_id: remove spaces and enforce valid characters only
        track_id = track_id.trim().replace(/[^a-zA-Z0-9\-_]/g, "");
        allTracks.push({
          track_id,
          title: track["title"],
          artist: track["artists"]
            ? track["artists"].map((a) => a.name).join(", ")
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
        });
        console.log(
          `[Discogs Index] Prepared track: ${track_id} - ${track["title"]}`
        );
      });
    }
    console.log(`[Discogs Index] Total tracks to upsert: ${allTracks.length}`);
    let index;
    try {
      index = await client.getIndex("tracks");
    } catch {
      index = await client.createIndex("tracks", { primaryKey: "track_id" });
    }

    let upserted = [];
    for (const [i, track] of allTracks.entries()) {
      if (i % 100 === 0)
        console.log(
          `[Discogs Index] Upserting track ${i + 1}/${allTracks.length}`
        );
      // Query DB for existing record and merge custom fields before adding to upserted
      const { rows } = await pool.query(
        "SELECT * FROM tracks WHERE track_id = $1",
        [track.track_id]
      );
      let merged = { ...track };
      if (rows.length) {
        // Merge custom fields from DB
        for (const field of [
          "bpm",
          "key",
          "notes",
          "local_tags",
          "apple_music_url",
        ]) {
          if (rows[0][field] !== undefined && rows[0][field] !== null) {
            merged[field] = rows[0][field];
          }
        }
      }
      // Upsert in DB
      await pool.query(
        `
        INSERT INTO tracks (
          track_id, title, artist, album, year, styles, genres, duration, position, discogs_url, album_thumbnail, bpm, key, notes, local_tags, apple_music_url, duration_seconds
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
        )
        ON CONFLICT (track_id) DO UPDATE SET
          title=EXCLUDED.title,
          artist=EXCLUDED.artist,
          album=EXCLUDED.album,
          year=EXCLUDED.year,
          styles=EXCLUDED.styles,
          genres=EXCLUDED.genres,
          duration=EXCLUDED.duration,
          position=EXCLUDED.position,
          discogs_url=EXCLUDED.discogs_url,
          album_thumbnail=EXCLUDED.album_thumbnail,
          bpm=COALESCE(tracks.bpm, EXCLUDED.bpm),
          key=COALESCE(tracks.key, EXCLUDED.key),
          notes=COALESCE(tracks.notes, EXCLUDED.notes),
          local_tags=COALESCE(tracks.local_tags, EXCLUDED.local_tags),
          apple_music_url=COALESCE(tracks.apple_music_url, EXCLUDED.apple_music_url),
          duration_seconds=COALESCE(tracks.duration_seconds, EXCLUDED.duration_seconds)
      `,
        [
          merged.track_id,
          merged.title,
          merged.artist,
          merged.album,
          merged.year,
          merged.styles,
          merged.genres,
          merged.duration,
          merged.position,
          merged.discogs_url,
          merged.album_thumbnail,
          merged.bpm,
          merged.key,
          merged.notes,
          merged.local_tags,
          merged.apple_music_url,
          merged.duration_seconds,
        ]
      );
      upserted.push(merged);
    }

    await index.updateSearchableAttributes([
      "title",
      "artist",
      "album",
      "local_tags",
      "styles",
      "genres",
    ]);
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
    ]);
    console.log(
      `[Discogs Index] Adding ${upserted.length} tracks to MeiliSearch index...`
    );

    for (const t of upserted) {
      if (!Array.isArray(t.local_tags)) {
        delete t.local_tags; // Remove if not an array
      }
      if (t.bpm === null || t.bpm === undefined) delete t.bpm;
      if (t.key === null || t.key === "") delete t.key;
      if (t.notes === null || t.notes === "") delete t.notes;
      if (t.apple_music_url === null || t.apple_music_url === undefined)
        delete t.apple_music_url;
      if (t.duration_seconds === null || t.duration_seconds === undefined)
        delete t.duration_seconds;
    }

    // Write upserted tracks to a JSON file for debugging
    fs.writeFileSync(
      path.join(DISCOGS_EXPORTS_DIR, "debug_upserted_tracks.json"),
      JSON.stringify(upserted, null, 2),
      "utf-8"
    );

    const { taskUid } = await index.addDocuments(upserted);
    console.log(
      `🚀 Added ${upserted.length} tracks to MeiliSearch (task UID: ${taskUid})`
    );

    // await index.waitForTask(task.taskUid);
    console.log(
      `[Discogs Index] Done. Upserted and indexed ${upserted.length} tracks.`
    );
    await pool.end();

    return NextResponse.json({
      message: `Upserted and indexed ${upserted.length} tracks from discogs_exports.`,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
