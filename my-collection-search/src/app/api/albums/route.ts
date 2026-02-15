// API endpoint for searching and listing albums using MeiliSearch
// Supports sorting by date_added, year, title, album_rating
// Example: /api/albums?q=jazz&sort=date_added:desc&friend_id=1&limit=20&offset=0
import { NextRequest, NextResponse } from "next/server";
import { getMeiliClient } from "@/lib/meili";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

    // Attach library username for each friend_id so cards can show source library.
    const hits = Array.isArray(searchResults.hits) ? searchResults.hits : [];
    const friendIds = Array.from(
      new Set(
        hits
          .map((h) => (h as { friend_id?: unknown }).friend_id)
          .filter((id): id is number => typeof id === "number")
      )
    );

    const usernameByFriendId = new Map<number, string>();
    if (friendIds.length > 0) {
      const { rows } = await pool.query(
        "SELECT id, username FROM friends WHERE id = ANY($1::int[])",
        [friendIds]
      );
      for (const row of rows) {
        usernameByFriendId.set(Number(row.id), String(row.username));
      }
    }

    const enrichedHits = hits.map((hit) => {
      const friend_id = (hit as { friend_id?: unknown }).friend_id;
      if (typeof friend_id !== "number") return hit;
      return {
        ...hit,
        username: usernameByFriendId.get(friend_id) || undefined,
      };
    });

    // Attach first available audio-derived cover for each (release_id, friend_id) pair.
    const albumRefs = enrichedHits
      .map((h) => ({
        release_id: (h as { release_id?: unknown }).release_id,
        friend_id: (h as { friend_id?: unknown }).friend_id,
      }))
      .filter(
        (r): r is { release_id: string; friend_id: number } =>
          typeof r.release_id === "string" && typeof r.friend_id === "number"
      );

    const coverByAlbumKey = new Map<string, string>();
    if (albumRefs.length > 0) {
      const values: string[] = [];
      const params: Array<string | number> = [];
      albumRefs.forEach((ref, idx) => {
        const p = idx * 2;
        values.push(`($${p + 1}::text, $${p + 2}::integer)`);
        params.push(ref.release_id, ref.friend_id);
      });

      const { rows: coverRows } = await pool.query(
        `
        WITH refs(release_id, friend_id) AS (
          VALUES ${values.join(", ")}
        )
        SELECT DISTINCT ON (t.release_id, t.friend_id)
          t.release_id,
          t.friend_id,
          t.audio_file_album_art_url
        FROM tracks t
        INNER JOIN refs r
          ON r.release_id = t.release_id AND r.friend_id = t.friend_id
        WHERE t.audio_file_album_art_url IS NOT NULL
          AND t.audio_file_album_art_url <> ''
        ORDER BY t.release_id, t.friend_id, t.id ASC
        `,
        params
      );

      for (const row of coverRows) {
        if (
          typeof row.release_id === "string" &&
          typeof row.friend_id === "number" &&
          typeof row.audio_file_album_art_url === "string"
        ) {
          coverByAlbumKey.set(
            `${row.release_id}:${row.friend_id}`,
            row.audio_file_album_art_url
          );
        }
      }
    }

    const finalHits = enrichedHits.map((hit) => {
      const release_id = (hit as { release_id?: unknown }).release_id;
      const friend_id = (hit as { friend_id?: unknown }).friend_id;
      if (typeof release_id !== "string" || typeof friend_id !== "number") {
        return hit;
      }
      return {
        ...hit,
        audio_file_album_art_url:
          coverByAlbumKey.get(`${release_id}:${friend_id}`) || undefined,
      };
    });

    return NextResponse.json({
      hits: finalHits,
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
