import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(
  _req: Request,
  context: { params: { id: string } }
) {
  try {
    const idParam = context.params?.id;
    const id = Number(idParam);
    if (!idParam || Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid playlist id" }, { status: 400 });
    }

    // Ensure playlist exists
    const exists = await pool.query("SELECT 1 FROM playlists WHERE id = $1", [id]);
    if (exists.rowCount === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    // Fetch ordered track ids for the playlist
    const tracksRes = await pool.query(
      "SELECT track_id FROM playlist_tracks WHERE playlist_id = $1 ORDER BY position ASC",
      [id]
    );
    const trackIds = tracksRes.rows.map((r: { track_id: string }) => r.track_id);
    return NextResponse.json({ playlist_id: id, track_ids: trackIds });
  } catch (error) {
    console.error("Error fetching playlist tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist tracks" },
      { status: 500 }
    );
  }
}
