/**
 * Preview identity embedding text for a track (debugging endpoint)
 * GET /api/embeddings/identity-preview?track_id=...&friend_id=...
 */

import { NextRequest, NextResponse } from "next/server";
import { getIdentityPreview } from "@/lib/identity-embedding";

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

    const preview = await getIdentityPreview(track_id, friendIdNum);

    return NextResponse.json(preview);
  } catch (error) {
    console.error("[Identity Preview] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate preview",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
