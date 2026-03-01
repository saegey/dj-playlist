// API endpoint for searching and listing albums using MeiliSearch
// Supports sorting by date_added, year, title, album_rating
// Example: /api/albums?q=jazz&sort=date_added:desc&friend_id=1&limit=20&offset=0
import { NextRequest, NextResponse } from "next/server";
import { albumApiService } from "@/server/services/albumApiService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const friendId = searchParams.get("friend_id");

    // Support multiple sort options:
    // - date_added:desc (recently added, default)
    // - date_added:asc (oldest first)
    // - year:desc (newest releases)
    // - year:asc (oldest releases)
    // - title:asc (alphabetical)
    // - album_rating:desc (highest rated)
    const sort = searchParams.get("sort") || "date_added:desc";

    const response = await albumApiService.searchAlbums({
      q,
      limit,
      offset,
      friendId,
      sort,
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error searching albums:", error);
    return NextResponse.json(
      {
        error: "Failed to search albums",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
