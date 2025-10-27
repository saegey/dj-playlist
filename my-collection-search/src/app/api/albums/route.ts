// API endpoint for searching and listing albums using MeiliSearch
// Supports sorting by date_added, year, title, album_rating
// Example: /api/albums?q=jazz&sort=date_added:desc&friend_id=1&limit=20&offset=0
import { NextRequest, NextResponse } from "next/server";
import { getMeiliClient } from "@/lib/meili";

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

    const meiliClient = getMeiliClient();
    const index = meiliClient.index("albums");

    // Build filter
    const filters: string[] = [];
    if (friendId) {
      filters.push(`friend_id = ${friendId}`);
    }

    const filterString = filters.length > 0 ? filters.join(" AND ") : undefined;

    // Search albums
    const searchResults = await index.search(q, {
      limit,
      offset,
      filter: filterString,
      sort: [sort],
    });

    return NextResponse.json({
      hits: searchResults.hits,
      estimatedTotalHits: searchResults.estimatedTotalHits,
      offset: searchResults.offset,
      limit: searchResults.limit,
      query: q,
      sort,
    });
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
