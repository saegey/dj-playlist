import { NextResponse } from "next/server";
import { Pool } from "pg";
import { redisJobService } from "@/services/redisJobService";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { track_id?: string; friend_id?: number };
    const track_id = body?.track_id;
    const friend_id = body?.friend_id;

    if (!track_id || typeof friend_id !== "number") {
      return NextResponse.json(
        { error: "track_id and friend_id are required" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      "SELECT track_id, friend_id, local_audio_url FROM tracks WHERE track_id = $1 AND friend_id = $2 LIMIT 1",
      [track_id, friend_id]
    );
    const row = rows[0];
    if (!row?.local_audio_url) {
      return NextResponse.json(
        { error: "Track has no local_audio_url" },
        { status: 400 }
      );
    }

    const jobId = await redisJobService.createDurationJob({
      track_id,
      friend_id,
      local_audio_url: row.local_audio_url,
    });

    return NextResponse.json({
      jobId,
      track_id,
      friend_id,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error fixing duration:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fix duration" },
      { status: 500 }
    );
  }
}
