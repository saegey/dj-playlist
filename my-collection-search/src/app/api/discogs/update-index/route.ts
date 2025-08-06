import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { Index, MeiliSearch } from "meilisearch";
import { parseDurationToSeconds } from "@/lib/trackUtils";

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

interface Artist { name: string; }
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
    return await meiliClient.getIndex("tracks");
  } catch {
    await meiliClient.createIndex("tracks", { primaryKey: "id" });
    return meiliClient.index("tracks");
  }
}

export async function POST() {
  try {
    const { getMeiliClient } = await import("@/lib/meili");
    const meiliClient = getMeiliClient({ server: true });

    if (!fs.existsSync(DISCOGS_EXPORTS_DIR)) {
      return NextResponse.json({ error: "discogs_exports not found" }, { status: 404 });
    }

    const manifestFiles = fs
      .readdirSync(DISCOGS_EXPORTS_DIR)
      .filter((f) => /^manifest_.+\.json$/.test(f));

    if (!manifestFiles.length) {
      return NextResponse.json({ error: "No manifest JSON files found" }, { status: 404 });
    }

    const allTracks: Track[] = [];

    for (const manifestFile of manifestFiles) {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(DISCOGS_EXPORTS_DIR, manifestFile), "utf-8")
      );
      const username =
        manifest.username || manifestFile.replace(/^manifest_|\.json$/g, "");

      const releaseIds: string[] = manifest.releaseIds || [];
      for (const releaseId of releaseIds) {
        let releasePath = path.join(
          DISCOGS_EXPORTS_DIR,
          `release_${releaseId}.json`
        );

        if (
          !fs.existsSync(releasePath) &&
          username &&
          process.env.DISCOGS_USERNAME &&
          username !== process.env.DISCOGS_USERNAME
        ) {
          const alt = path.join(
            DISCOGS_EXPORTS_DIR,
            `${username}_release_${releaseId}.json`
          );
          if (fs.existsSync(alt)) {
            releasePath = alt;
          }
        }

        if (!fs.existsSync(releasePath)) {
          console.warn(`[Discogs Index] ❌ Release JSON not found: ${releasePath}`);
          continue;
        }

        const album = JSON.parse(
          fs.readFileSync(releasePath, "utf-8")
        ) as DiscogsRelease;

        const artist_name =
          album.artists_sort ||
          album.artists?.[0]?.name ||
          "Unknown Artist";

        album.tracklist.forEach((tr: ProcessedTrack) => {
          let track_id = `${album.id}-${tr.position}`
            .trim()
            .replace(/[^A-Za-z0-9\-_]/g, "");

          allTracks.push({
            track_id,
            title: tr.title,
            artist: tr.artists?.map((a) => a.name).join(", ") || artist_name,
            album: album.title,
            year: album.year,
            styles: album.styles || [],
            genres: album.genres || [],
            duration: tr.duration,
            discogs_url: album.uri,
            album_thumbnail: album.thumb,
            position: tr.position,
            duration_seconds:
              typeof tr.duration_seconds === "number"
                ? tr.duration_seconds
                : parseDurationToSeconds(tr.duration),
            bpm: null,
            key: null,
            notes: null,
            local_tags: [],
            apple_music_url: tr.apple_music_url || null,
            local_audio_url: tr.local_audio_url || null,
            username,
          });
        });
      }
    }

    const index = await getOrCreateTracksIndex(meiliClient);

    // configure embedders (unchanged)…
    try {
      await fetch(
        `${meiliClient.config.host}/indexes/tracks/settings/embedders`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${meiliClient.config.apiKey ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            default: { source: "userProvided", dimensions: 1536 },
          }),
        }
      );
    } catch (err) {
      console.warn("Error setting MeiliSearch embedders:", err);
    }

    // 1) Upsert via RETURNING *
    const upserted: Track[] = [];
    for (const track of allTracks) {
      const { rows: insertedRows } = await pool.query(
        `
        INSERT INTO tracks (
          track_id, title, artist, album, year,
          styles, genres, duration, position,
          discogs_url, album_thumbnail,
          bpm, key, notes, local_tags,
          apple_music_url, duration_seconds, username
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          $10,$11,$12,$13,$14,$15,$16,$17,$18
        )
        ON CONFLICT (track_id, username)
        DO UPDATE SET
          discogs_url     = EXCLUDED.discogs_url,
          album_thumbnail = EXCLUDED.album_thumbnail
        RETURNING *;
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

      if (insertedRows.length !== 1) {
        console.warn(
          `[Discogs Index] Expected 1 row for ${track.track_id}@${track.username}, got ${insertedRows.length}`
        );
      }
      upserted.push(insertedRows[0]);
    }

    // 2) Update Meili settings & index
    await index.updateSearchableAttributes([
      "local_tags", "artist", "album", "styles", "title", "notes", "genres",
    ]);
    await index.updateFilterableAttributes([
      "track_id", "username", "bpm", "genres", "key", "year",
      "local_tags", "styles", "local_audio_url", "apple_music_url", "hasVectors",
    ]);
    await index.updateRankingRules([
      "words", "typo", "proximity", "attribute", "sort", "exactness"
    ]);

    await index.addDocuments(
      upserted.map((t) => {
        const { embedding, ...rest } = t as any;
        let vectorArr: number[] | null = null;
        if (Array.isArray(embedding)) vectorArr = embedding;
        else if (typeof embedding === "string") {
          try { vectorArr = JSON.parse(embedding); } catch {}
        }
        return {
          ...rest,
          _vectors: { default: vectorArr },
          hasVectors: !!vectorArr,
        };
      })
    );

    return NextResponse.json({
      message: `Upserted & indexed ${upserted.length} tracks.`,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}