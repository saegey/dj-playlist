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

import { generateAndStoreIdentityEmbedding } from "../lib/identity-embedding";
import { generateAndStoreAudioVibeEmbedding } from "../lib/audio-vibe-embedding";
import { embeddingsRepository } from "../services/embeddingsRepository";
import type {
  EmbeddingBackfillOptions,
  EmbeddingType,
} from "../types/backfill";

/**
 * Parse command-line arguments
 */
function parseArgs(): EmbeddingBackfillOptions {
  const args = process.argv.slice(2);
  const options: EmbeddingBackfillOptions = {
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
  options: EmbeddingBackfillOptions
): Promise<{ track_id: string; friend_id: number }[]> {
  return embeddingsRepository.listTracksForBackfill(options);
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

    process.exit(allFailed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  }
}

main();
