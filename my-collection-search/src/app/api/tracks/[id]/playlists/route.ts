import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const track_id = (await params).id;
    const friendIdRaw = request.nextUrl.searchParams.get("friend_id")?.trim();

    if (!track_id || !friendIdRaw) {
      return NextResponse.json(
        { error: "Missing required parameters: track_id and friend_id" },
        { status: 400 }
      );
    }

    const friend_id = Number(friendIdRaw);
    if (!Number.isFinite(friend_id)) {
      return NextResponse.json(
        { error: "friend_id must be a number" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        pt.position
      FROM playlist_tracks pt
      JOIN playlists p ON p.id = pt.playlist_id
      WHERE pt.track_id = $1 AND pt.friend_id = $2
      ORDER BY p.name ASC, pt.position ASC
      `,
      [track_id, friend_id]
    );

    return NextResponse.json({ playlists: rows });
  } catch (error) {
    console.error("Error fetching track playlist memberships:", error);
    return NextResponse.json(
      { error: "Failed to fetch track playlists" },
      { status: 500 }
    );
  }
}
