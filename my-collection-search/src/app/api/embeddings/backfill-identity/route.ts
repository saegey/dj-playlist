/**
 * Backfill identity embeddings for tracks
 * POST /api/embeddings/backfill-identity
 *
 * Query params:
 * - friend_id: number (optional, defaults to all friends)
 * - force: boolean (optional, force re-embedding even if hash unchanged)
 * - limit: number (optional, limit number of tracks to process)
 * - batch_size: number (optional, number of tracks to process in parallel, default 5)
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { generateAndStoreIdentityEmbedding } from "@/lib/identity-embedding";

export const maxDuration = 300; // 5 minutes

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface BackfillOptions {
  friend_id?: number;
  force?: boolean;
  limit?: number;
  batch_size?: number;
}

/**
 * Fetch tracks that need identity embeddings
 */
async function getTracksNeedingEmbeddings(
  options: BackfillOptions
): Promise<{ track_id: string; friend_id: number }[]> {
  const { friend_id, force, limit } = options;

  let query: string;
  const params: any[] = [];

  if (force) {
    // Get all tracks
    query = `
      SELECT track_id, friend_id
      FROM tracks
      ${friend_id ? "WHERE friend_id = $1" : ""}
      ORDER BY friend_id, track_id
      ${limit ? `LIMIT ${limit}` : ""}
    `;
    if (friend_id) params.push(friend_id);
  } else {
    // Get tracks without embeddings or with stale hashes
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
  force: boolean
): Promise<{
  success: number;
  failed: { track_id: string; friend_id: number; error: string }[];
  skipped: number;
}> {
  const results = await Promise.allSettled(
    tracks.map((t) =>
      generateAndStoreIdentityEmbedding(t.track_id, t.friend_id, force)
    )
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

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const options: BackfillOptions = {
      friend_id: searchParams.get("friend_id")
        ? parseInt(searchParams.get("friend_id")!, 10)
        : undefined,
      force: searchParams.get("force") === "true",
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!, 10)
        : undefined,
      batch_size: searchParams.get("batch_size")
        ? parseInt(searchParams.get("batch_size")!, 10)
        : 5,
    };

    console.log("[Backfill Identity] Starting with options:", options);

    // Fetch tracks needing embeddings
    const tracks = await getTracksNeedingEmbeddings(options);
    console.log(`[Backfill Identity] Found ${tracks.length} tracks to process`);

    if (tracks.length === 0) {
      return NextResponse.json({
        message: "No tracks need identity embeddings",
        total: 0,
        success: 0,
        failed: [],
        skipped: 0,
      });
    }

    // Process in batches
    const batchSize = options.batch_size || 5;
    let totalSuccess = 0;
    let totalSkipped = 0;
    const allFailed: { track_id: string; friend_id: number; error: string }[] = [];

    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      console.log(
        `[Backfill Identity] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tracks.length / batchSize)} (${batch.length} tracks)`
      );

      const { success, failed, skipped } = await processBatch(
        batch,
        options.force || false
      );

      totalSuccess += success;
      totalSkipped += skipped;
      allFailed.push(...failed);

      // Log progress
      console.log(
        `[Backfill Identity] Batch complete: ${success} success, ${skipped} skipped, ${failed.length} failed`
      );
    }

    console.log(
      `[Backfill Identity] Complete: ${totalSuccess} success, ${totalSkipped} skipped, ${allFailed.length} failed`
    );

    return NextResponse.json({
      message: "Backfill complete",
      total: tracks.length,
      success: totalSuccess,
      skipped: totalSkipped,
      failed: allFailed,
    });
  } catch (error) {
    console.error("[Backfill Identity] Error:", error);
    return NextResponse.json(
      {
        error: "Backfill failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
