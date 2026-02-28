import { NextResponse } from "next/server";
import { Pool } from "pg";
import {
  playlistDetailParamsSchema,
  playlistDetailResponseSchema,
} from "@/api-contract/schemas";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const parsedParams = playlistDetailParamsSchema.safeParse({ id: idParam });
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid playlist id", details: parsedParams.error.flatten() },
        { status: 400 }
      );
    }
    const id = parsedParams.data.id;

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
      (r: { track_id: string; friend_id: number; position: number }) => {
        return {
          track_id: r.track_id,
          friend_id: Number(r.friend_id), // Ensure it's a number
          position: r.position,
        };
      }
    );
    const response = {
      playlist_id: id,
      tracks: trackIds,
      playlist_name: playlistRes.rows[0].name,
    };
    const validated = playlistDetailResponseSchema.parse(response);
    return NextResponse.json(validated);
  } catch (error) {
    console.error("Error fetching playlist tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist tracks" },
      { status: 500 }
    );
  }
}
