import { NextRequest, NextResponse } from "next/server";
import { albumApiService } from "@/server/services/albumApiService";

/**
 * GET /api/albums/[releaseId]?friend_id=X
 * Fetch a single album with its tracks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ releaseId: string }> }
) {
  try {
    const { releaseId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const friendId = searchParams.get("friend_id");

    if (!friendId) {
      return NextResponse.json(
        { error: "friend_id query parameter is required" },
        { status: 400 }
      );
    }
    const parsedFriendId = Number.parseInt(friendId, 10);
    if (!Number.isFinite(parsedFriendId)) {
      return NextResponse.json({ error: "friend_id must be a number" }, { status: 400 });
    }

    const detail = await albumApiService.getAlbumDetail(releaseId, parsedFriendId);
    if (!detail) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("[Album Detail API] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
