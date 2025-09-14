import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: Request) {
  try {
    // Parse pagination and username params from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
    const offset = (page - 1) * pageSize;
    const friendId = searchParams.get("friendId");

    // Build WHERE clause: missing apple_music_url AND missing youtube_url AND missing soundcloud_url
    let where =
      "(apple_music_url IS NULL OR apple_music_url = '') AND (youtube_url IS NULL OR youtube_url = '') AND (soundcloud_url IS NULL OR soundcloud_url = '')";
    let params: (string | number)[] = [pageSize, offset];
    if (friendId) {
      where += " AND friend_id = $3";
      params = [pageSize, offset, friendId];
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM tracks WHERE ${where}`;
    const countParams = friendId ? [friendId] : [];
    const countResult = await pool.query(
      countQuery.replace(/\$3/g, "$1"), // $1 for count param if username
      countParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const selectQuery = `SELECT * FROM tracks WHERE ${where} ORDER BY id DESC LIMIT $1 OFFSET $2`;
    const { rows } = await pool.query(selectQuery, params);

    return NextResponse.json({
      tracks: rows,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching tracks missing Apple Music URL:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 }
    );
  }
}
