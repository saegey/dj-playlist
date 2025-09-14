import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!idParam || Number.isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid playlist id" },
        { status: 400 }
      );
    }

    // Ensure playlist exists
    const playlistRes = await pool.query(
      "SELECT * FROM playlists WHERE id = $1",
      [id]
    );
    if (playlistRes.rowCount === 0) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    // Fetch ordered track ids for the playlist
    const tracksRes = await pool.query(
      "SELECT track_id, friend_id, position FROM playlist_tracks WHERE playlist_id = $1 ORDER BY position ASC",
      [id]
    );
    const trackIds = tracksRes.rows.map(
      (r: { track_id: string; friend_id: string; position: number }) => {
        return {
          track_id: r.track_id,
          friend_id: r.friend_id,
          position: r.position,
        };
      }
    );
    return NextResponse.json({
      playlist_id: id,
      tracks: trackIds,
      playlist_name: playlistRes.rows[0].name,
    });
  } catch (error) {
    console.error("Error fetching playlist tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist tracks" },
      { status: 500 }
    );
  }
}
