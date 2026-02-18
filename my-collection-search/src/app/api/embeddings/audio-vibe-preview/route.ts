/**
 * Preview audio vibe embedding text for a track (debugging endpoint)
 * GET /api/embeddings/audio-vibe-preview?track_id=...&friend_id=...
 */

import { NextRequest, NextResponse } from "next/server";
import { getAudioVibePreview } from "@/lib/audio-vibe-embedding";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const track_id = searchParams.get("track_id");
    const friend_id = searchParams.get("friend_id");

    if (!track_id || !friend_id) {
      return NextResponse.json(
        { error: "Missing track_id or friend_id" },
        { status: 400 }
      );
    }

    const friendIdNum = parseInt(friend_id, 10);
    if (isNaN(friendIdNum)) {
      return NextResponse.json({ error: "Invalid friend_id" }, { status: 400 });
    }

    const preview = await getAudioVibePreview(track_id, friendIdNum);

    return NextResponse.json(preview);
  } catch (error) {
    console.error("[Audio Vibe Preview] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate preview",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
