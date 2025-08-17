import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const track_id = (await params).id;
    const username = request.nextUrl.searchParams.get("username")?.trim();

    if (!track_id || !username) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: track_id (path) and username (query)",
        },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      "SELECT * FROM tracks WHERE track_id = $1 AND username = $2 LIMIT 1",
      [track_id, username]
    );
    const track = rows[0] || null;

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    return NextResponse.json(track);
  } catch (error) {
    console.error("Error fetching track by id & username:", error);
    return NextResponse.json(
      { error: "Failed to fetch track" },
      { status: 500 }
    );
  }
}
