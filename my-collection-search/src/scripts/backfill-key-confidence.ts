#!/usr/bin/env node
/**
 * Backfill tracks.key_confidence from already-saved Essentia analysis JSON (#524).
 *
 * key_confidence (key_edma.strength) was only ever stored starting with
 * #524; tracks analyzed before it have a `key` but no `key_confidence`.
 * Re-running Essentia for every one would be expensive (CPU-bound, no batch
 * endpoint) for a value that's usually already sitting on disk: every past
 * analysis run — download-worker and the upload route alike — persisted its
 * full Essentia JSON under ESSENTIA_DATA_DIR, so this reads that instead of
 * re-analyzing anything.
 *
 * Usage:
 *   npm run backfill-key-confidence
 *   npm run backfill-key-confidence -- --friend_id=6
 *   npm run backfill-key-confidence -- --dry-run
 *   npm run backfill-key-confidence -- --limit=500
 */

import { trackRepository } from "../server/repositories/trackRepository";
import { readEssentiaAnalysis } from "../lib/essentia-storage";
import { extractKeyAnalysis, type EssentiaTonal } from "../lib/essentiaKey";

type Options = {
  friend_id?: number;
  limit?: number;
  dryRun?: boolean;
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
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg.startsWith("--limit=")) {
      const value = Number.parseInt(arg.split("=")[1], 10);
      if (Number.isNaN(value) || value <= 0) {
        console.error("Invalid --limit value");
        process.exit(1);
      }
      options.limit = value;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: npm run backfill-key-confidence [options]

Options:
  --friend_id=N   Only process tracks for this friend_id
  --dry-run       Report what would change without writing anything
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

  console.log("Starting key_confidence backfill...");
  console.log("Options:", opts);

  const rows = await trackRepository.findTracksMissingKeyConfidence(
    opts.friend_id ?? null,
    opts.limit
  );

  let updated = 0;
  let skippedNoFile = 0;
  let skippedNoStrength = 0;
  const errors: { track_id: string; friend_id: number; error: string }[] = [];

  for (const row of rows) {
    try {
      const saved = readEssentiaAnalysis(row.track_id, row.friend_id);
      if (!saved) {
        skippedNoFile += 1;
        continue;
      }

      const payload = saved.payload as { analysis?: { tonal?: EssentiaTonal } };
      const { key_confidence } = extractKeyAnalysis(payload?.analysis?.tonal);
      if (key_confidence === null) {
        skippedNoStrength += 1;
        continue;
      }

      if (!opts.dryRun) {
        await trackRepository.updateTrackFields({
          track_id: row.track_id,
          friend_id: row.friend_id,
          key_confidence,
        });
      }
      updated += 1;
    } catch (err) {
      errors.push({
        track_id: row.track_id,
        friend_id: row.friend_id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.log("Done.");
  console.log({
    total_candidates: rows.length,
    updated,
    skipped_no_file: skippedNoFile,
    skipped_no_strength: skippedNoStrength,
    errors: errors.length,
    dry_run: Boolean(opts.dryRun),
  });

  if (errors.length > 0) {
    errors.slice(0, 10).forEach((error) => {
      console.error(`Failed to backfill ${error.track_id}:${error.friend_id} ${error.error}`);
    });
  }
}

main().catch((err) => {
  console.error("key_confidence backfill script failed:", err);
  process.exit(1);
});
