import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { Album } from "@/types/track";

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

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Fetch album
    const albumResult = await pool.query<Album>(
      `SELECT * FROM albums WHERE release_id = $1 AND friend_id = $2`,
      [releaseId, friendId]
    );

    if (albumResult.rows.length === 0) {
      await pool.end();
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    const album = albumResult.rows[0];

    // Fetch tracks for this album
    const tracksResult = await pool.query(
      `SELECT * FROM tracks
       WHERE release_id = $1 AND friend_id = $2
       ORDER BY position`,
      [releaseId, friendId]
    );

    await pool.end();

    return NextResponse.json({
      album,
      tracks: tracksResult.rows,
    });
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
