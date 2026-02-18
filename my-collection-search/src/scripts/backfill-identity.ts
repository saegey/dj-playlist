#!/usr/bin/env node
/**
 * CLI script to backfill embeddings for tracks
 *
 * Usage:
 *   npm run backfill-identity
 *   npm run backfill-identity -- --type=audio_vibe
 *   npm run backfill-identity -- --friend_id=1
 *   npm run backfill-identity -- --limit=100 --batch_size=10
 *   npm run backfill-identity -- --force
 */

import { Pool } from "pg";
import { generateAndStoreIdentityEmbedding } from "../lib/identity-embedding";
import { generateAndStoreAudioVibeEmbedding } from "../lib/audio-vibe-embedding";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type EmbeddingType = "identity" | "audio_vibe";

interface BackfillOptions {
  type: EmbeddingType;
  friend_id?: number;
  force?: boolean;
  limit?: number;
  batch_size?: number;
}

/**
 * Parse command-line arguments
 */
function parseArgs(): BackfillOptions {
  const args = process.argv.slice(2);
  const options: BackfillOptions = {
    type: "identity", // Default
    batch_size: 5, // Default
  };

  for (const arg of args) {
    if (arg.startsWith("--type=")) {
      const type = arg.split("=")[1] as EmbeddingType;
      if (type !== "identity" && type !== "audio_vibe") {
        console.error(`❌ Invalid type: ${type}. Must be 'identity' or 'audio_vibe'`);
        process.exit(1);
      }
      options.type = type;
    } else if (arg.startsWith("--friend_id=")) {
      options.friend_id = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--limit=")) {
      options.limit = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--batch_size=")) {
      options.batch_size = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: npm run backfill-identity [options]

Options:
  --type=TYPE        Embedding type: 'identity' or 'audio_vibe' (default: identity)
  --friend_id=N      Only process tracks for this friend_id
  --limit=N          Limit number of tracks to process
  --batch_size=N     Number of concurrent embeddings (default: 5)
  --force            Force re-embedding even if hash unchanged
  --help, -h         Show this help message

Examples:
  npm run backfill-identity
  npm run backfill-identity -- --type=audio_vibe
  npm run backfill-identity -- --friend_id=1
  npm run backfill-identity -- --limit=100 --batch_size=10
  npm run backfill-identity -- --type=audio_vibe --force
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Fetch tracks that need embeddings
 */
async function getTracksNeedingEmbeddings(
  options: BackfillOptions
): Promise<{ track_id: string; friend_id: number }[]> {
  const { type, friend_id, force, limit } = options;

  let query: string;
  const params: any[] = [];

  if (force) {
    // Get all tracks (for audio_vibe, also filter by having audio data)
    if (type === "audio_vibe") {
      query = `
        SELECT track_id, friend_id
        FROM tracks
        WHERE (bpm IS NOT NULL OR key IS NOT NULL OR danceability IS NOT NULL
               OR mood_happy IS NOT NULL OR mood_sad IS NOT NULL
               OR mood_relaxed IS NOT NULL OR mood_aggressive IS NOT NULL)
        ${friend_id ? "AND friend_id = $1" : ""}
        ORDER BY friend_id, track_id
        ${limit ? `LIMIT ${limit}` : ""}
      `;
    } else {
      query = `
        SELECT track_id, friend_id
        FROM tracks
        ${friend_id ? "WHERE friend_id = $1" : ""}
        ORDER BY friend_id, track_id
        ${limit ? `LIMIT ${limit}` : ""}
      `;
    }
    if (friend_id) params.push(friend_id);
  } else {
    // Get tracks without embeddings
    if (type === "audio_vibe") {
      query = `
        SELECT t.track_id, t.friend_id
        FROM tracks t
        LEFT JOIN track_embeddings te
          ON t.track_id = te.track_id
          AND t.friend_id = te.friend_id
          AND te.embedding_type = 'audio_vibe'
        WHERE te.id IS NULL
          AND (t.bpm IS NOT NULL OR t.key IS NOT NULL OR t.danceability IS NOT NULL
               OR t.mood_happy IS NOT NULL OR t.mood_sad IS NOT NULL
               OR t.mood_relaxed IS NOT NULL OR t.mood_aggressive IS NOT NULL)
        ${friend_id ? "AND t.friend_id = $1" : ""}
        ORDER BY t.friend_id, t.track_id
        ${limit ? `LIMIT ${limit}` : ""}
      `;
    } else {
      query = `
        SELECT t.track_id, t.friend_id
        FROM tracks t
        LEFT JOIN track_embeddings te
          ON t.track_id = te.track_id
          AND t.friend_id = te.friend_id
          AND te.embedding_type = 'identity'
        WHERE te.id IS NULL
        ${friend_id ? "AND t.friend_id = $1" : ""}
        ORDER BY t.friend_id, t.track_id
        ${limit ? `LIMIT ${limit}` : ""}
      `;
    }
    if (friend_id) params.push(friend_id);
  }

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Process tracks in batches with concurrency control
 */
async function processBatch(
  tracks: { track_id: string; friend_id: number }[],
  type: EmbeddingType,
  force: boolean
): Promise<{
  success: number;
  failed: { track_id: string; friend_id: number; error: string }[];
  skipped: number;
}> {
  const embeddingFn = type === "audio_vibe"
    ? generateAndStoreAudioVibeEmbedding
    : generateAndStoreIdentityEmbedding;

  const results = await Promise.allSettled(
    tracks.map((t) => embeddingFn(t.track_id, t.friend_id, force))
  );

  let success = 0;
  let skipped = 0;
  const failed: { track_id: string; friend_id: number; error: string }[] = [];

  results.forEach((result, index) => {
    const track = tracks[index];

    if (result.status === "fulfilled") {
      if (result.value.updated) {
        success++;
      } else {
        skipped++;
      }
    } else {
      failed.push({
        track_id: track.track_id,
        friend_id: track.friend_id,
        error: result.reason?.message || String(result.reason),
      });
    }
  });

  return { success, failed, skipped };
}

/**
 * Main backfill function
 */
async function main() {
  const options = parseArgs();

  const typeLabel = options.type === "audio_vibe" ? "audio vibe" : "identity";
  console.log(`🚀 Starting ${typeLabel} embedding backfill`);
  console.log("Options:", options);
  console.log("");

  try {
    // Fetch tracks needing embeddings
    const tracks = await getTracksNeedingEmbeddings(options);
    console.log(`📊 Found ${tracks.length} tracks to process\n`);

    if (tracks.length === 0) {
      console.log(`✅ No tracks need ${typeLabel} embeddings`);
      await pool.end();
      process.exit(0);
    }

    // Process in batches
    const batchSize = options.batch_size || 5;
    let totalSuccess = 0;
    let totalSkipped = 0;
    const allFailed: { track_id: string; friend_id: number; error: string }[] =
      [];

    const totalBatches = Math.ceil(tracks.length / batchSize);
    const startTime = Date.now();

    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;

      process.stdout.write(
        `\r⏳ Processing batch ${batchNum}/${totalBatches} (${batch.length} tracks)...`
      );

      const { success, failed, skipped } = await processBatch(
        batch,
        options.type,
        options.force || false
      );

      totalSuccess += success;
      totalSkipped += skipped;
      allFailed.push(...failed);

      // Show inline progress
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const processed = i + batch.length;
      const rate = processed / elapsed;
      const remaining = Math.round((tracks.length - processed) / rate);

      process.stdout.write(
        `\r✓ Batch ${batchNum}/${totalBatches}: ${success} success, ${skipped} skipped, ${failed.length} failed | ${elapsed}s elapsed, ~${remaining}s remaining`
      );
      console.log("");
    }

    // Final summary
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log("\n" + "=".repeat(60));
    console.log("✅ Backfill complete!");
    console.log("=".repeat(60));
    console.log(`📊 Total tracks:     ${tracks.length}`);
    console.log(`✅ Success:          ${totalSuccess}`);
    console.log(`⏭️  Skipped:          ${totalSkipped}`);
    console.log(`❌ Failed:           ${allFailed.length}`);
    console.log(`⏱️  Total time:       ${totalTime}s`);
    console.log(`⚡ Rate:             ${(tracks.length / totalTime).toFixed(2)} tracks/sec`);

    if (allFailed.length > 0) {
      console.log("\n❌ Failed tracks:");
      allFailed.slice(0, 10).forEach((f) => {
        console.log(`  - ${f.track_id} (friend_id: ${f.friend_id}): ${f.error}`);
      });
      if (allFailed.length > 10) {
        console.log(`  ... and ${allFailed.length - 10} more`);
      }
    }

    await pool.end();
    process.exit(allFailed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    await pool.end();
    process.exit(1);
  }
}

main();
