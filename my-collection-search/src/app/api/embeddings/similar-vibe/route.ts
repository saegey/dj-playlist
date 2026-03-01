import { NextRequest, NextResponse } from "next/server";
import { embeddingsService } from "@/services/embeddingsService";

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trackId = searchParams.get("track_id");
    const friendIdRaw = searchParams.get("friend_id");
    const limit = parsePositiveInt(searchParams.get("limit"), 50);
    const ivfflatProbes = parsePositiveInt(searchParams.get("ivfflat_probes"), 10);

    if (!trackId || !friendIdRaw) {
      return NextResponse.json(
        { error: "Missing track_id or friend_id" },
        { status: 400 }
      );
    }

    const friendId = Number.parseInt(friendIdRaw, 10);
    if (Number.isNaN(friendId)) {
      return NextResponse.json({ error: "Invalid friend_id" }, { status: 400 });
    }

    const result = await embeddingsService.findSimilarVibe({
      trackId,
      friendId,
      limit,
      ivfflatProbes,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_audio_vibe_embedding") {
      return NextResponse.json(
        { error: "Track has no audio vibe embedding. Run backfill first." },
        { status: 404 }
      );
    }

    console.error("[Similar Vibe Tracks] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to find similar vibe tracks",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
