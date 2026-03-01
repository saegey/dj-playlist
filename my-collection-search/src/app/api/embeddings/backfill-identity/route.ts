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
import { embeddingsService } from "@/server/services/embeddingsService";
import type { BackfillOptions } from "@/types/backfill";

export const maxDuration = 300; // 5 minutes

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

    const result = await embeddingsService.backfillIdentity(options);
    if (result.total === 0) {
      return NextResponse.json({
        message: "No tracks need identity embeddings",
        ...result,
      });
    }

    return NextResponse.json({
      message: "Backfill complete",
      ...result,
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
