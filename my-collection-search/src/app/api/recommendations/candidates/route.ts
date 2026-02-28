/**
 * Recommendation Candidates API
 * GET /api/recommendations/candidates
 *
 * Retrieves candidate tracks from multiple embedding indexes
 * (identity, audio vibe) for recommendation.
 *
 * Query params:
 * - track_id (required): Seed track ID
 * - friend_id (required): Seed track's friend ID
 * - limit_identity (optional, default 200): Max identity candidates
 * - limit_audio (optional, default 200): Max audio vibe candidates
 * - ivfflat_probes (optional, default 10): Accuracy/speed tradeoff
 *
 * Example:
 * GET /api/recommendations/candidates?track_id=123&friend_id=1&limit_identity=300&limit_audio=150
 */

import { NextRequest, NextResponse } from "next/server";
import {
  retrieveCandidates,
  retrieveCandidatesForSeedTracks,
  hasEmbeddings,
  hasEmbeddingsForSeedTracks,
} from "@/lib/recommendation-candidate-retriever";
import {
  recommendationsQuerySchema,
  recommendationsBatchBodySchema,
  recommendationsResponseSchema,
} from "@/api-contract/schemas";

export async function GET(request: NextRequest) {
  try {
    const parsedQuery = recommendationsQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: "Invalid recommendation query parameters",
          details: parsedQuery.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { track_id, friend_id, limit_identity, limit_audio, ivfflat_probes } =
      parsedQuery.data;
    const friendIdNum = friend_id;
    const limitIdentity = limit_identity;
    const limitAudio = limit_audio;
    const ivfflatProbes = ivfflat_probes;

    // Validate limits
    if (limitIdentity < 1 || limitIdentity > 1000) {
      return NextResponse.json(
        { error: "limit_identity must be between 1 and 1000" },
        { status: 400 }
      );
    }
    if (limitAudio < 1 || limitAudio > 1000) {
      return NextResponse.json(
        { error: "limit_audio must be between 1 and 1000" },
        { status: 400 }
      );
    }

    // Check if seed track has embeddings
    const embeddings = await hasEmbeddings(track_id, friendIdNum);

    if (!embeddings.identity && !embeddings.audio) {
      return NextResponse.json(
        {
          error: "Seed track has no embeddings",
          message: `Track ${track_id} (friend_id: ${friendIdNum}) has neither identity nor audio vibe embeddings. Run backfill first.`,
          embeddings,
        },
        { status: 404 }
      );
    }

    // Retrieve candidates
    const result = await retrieveCandidates(track_id, friendIdNum, {
      limitIdentity,
      limitAudio,
      ivfflatProbes,
    });

    // Add embeddings info to response
    const response = {
      ...result,
      seedEmbeddings: embeddings,
    };
    const validated = recommendationsResponseSchema.parse(response);
    return NextResponse.json(validated);

  } catch (error) {
    console.error("[Recommendation Candidates] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve recommendation candidates",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsedBody = recommendationsBatchBodySchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid recommendation body",
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { tracks, limit_identity, limit_audio, ivfflat_probes } = parsedBody.data;

    if (limit_identity < 1 || limit_identity > 1000) {
      return NextResponse.json(
        { error: "limit_identity must be between 1 and 1000" },
        { status: 400 }
      );
    }
    if (limit_audio < 1 || limit_audio > 1000) {
      return NextResponse.json(
        { error: "limit_audio must be between 1 and 1000" },
        { status: 400 }
      );
    }

    const seedTracks = tracks.map((track) => ({
      trackId: track.track_id,
      friendId: track.friend_id,
    }));

    const embeddings = await hasEmbeddingsForSeedTracks(seedTracks);
    if (!embeddings.identity && !embeddings.audio) {
      return NextResponse.json(
        {
          error: "No embeddings found for provided seed tracks",
          message: "None of the provided tracks have identity or audio vibe embeddings.",
          embeddings,
        },
        { status: 404 }
      );
    }

    const result = await retrieveCandidatesForSeedTracks(seedTracks, {
      limitIdentity: limit_identity,
      limitAudio: limit_audio,
      ivfflatProbes: ivfflat_probes,
    });

    const response = {
      ...result,
      seedEmbeddings: embeddings,
    };
    const validated = recommendationsResponseSchema.parse(response);
    return NextResponse.json(validated);
  } catch (error) {
    console.error("[Recommendation Candidates POST] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve recommendation candidates",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
