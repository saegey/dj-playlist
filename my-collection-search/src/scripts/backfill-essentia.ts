#!/usr/bin/env node
/**
 * Queue analyze-local jobs for tracks with local audio.
 *
 * Usage:
 *   npm run backfill-essentia
 *   npm run backfill-essentia -- --friend_id=6
 *   npm run backfill-essentia -- --force
 */

import fs from "fs";
import { Pool } from "pg";
import { getEssentiaAnalysisPath } from "../lib/essentia-storage";
import { redisJobService } from "../services/redisJobService";

type Options = {
  friend_id?: number;
  force?: boolean;
  limit?: number;
};

type TrackRow = {
  track_id: string;
  friend_id: number;
  local_audio_url: string | null;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {};

  for (const arg of args) {
    if (arg.startsWith("--friend_id=")) {
      const value = Number.parseInt(arg.split("=")[1], 10);
      if (Number.isNaN(value) || value <= 0) {
        console.error("Invalid --friend_id value");
        process.exit(1);
      }
      options.friend_id = value;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg.startsWith("--limit=")) {
      const value = Number.parseInt(arg.split("=")[1], 10);
      if (Number.isNaN(value) || value <= 0) {
        console.error("Invalid --limit value");
        process.exit(1);
      }
      options.limit = value;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: npm run backfill-essentia [options]

Options:
  --friend_id=N   Only process tracks for this friend_id
  --force         Queue jobs even when Essentia JSON already exists
  --limit=N       Max number of candidate tracks to inspect
  --help, -h      Show this help message
      `);
      process.exit(0);
    }
  }

  return options;
}

async function main() {
  const opts = parseArgs();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log("Starting Essentia backfill queue...");
  console.log("Options:", opts);

  try {
    const params: (number | string)[] = [];
    const where = ["local_audio_url IS NOT NULL", "local_audio_url <> ''"];
    if (opts.friend_id) {
      where.push(`friend_id = $${params.length + 1}`);
      params.push(opts.friend_id);
    }

    const limitClause = opts.limit ? `LIMIT ${opts.limit}` : "";
    const query = `
      SELECT track_id, friend_id, local_audio_url
      FROM tracks
      WHERE ${where.join(" AND ")}
      ORDER BY friend_id, track_id
      ${limitClause}
    `;

    const { rows } = await pool.query<TrackRow>(query, params);

    let queued = 0;
    let skipped_existing = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        if (!row.local_audio_url) continue;

        if (!opts.force) {
          const analysisPath = getEssentiaAnalysisPath(row.track_id, row.friend_id);
          if (fs.existsSync(analysisPath)) {
            skipped_existing += 1;
            continue;
          }
        }

        await redisJobService.createAnalyzeLocalJob({
          track_id: row.track_id,
          friend_id: row.friend_id,
          local_audio_url: row.local_audio_url,
        });
        queued += 1;
      } catch (err) {
        errors += 1;
        console.error(
          `Failed to queue ${row.track_id}:${row.friend_id}`,
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    console.log("Done.");
    console.log({
      total_candidates: rows.length,
      queued,
      skipped_existing,
      errors,
      force: Boolean(opts.force),
    });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Essentia backfill script failed:", err);
  process.exit(1);
});
