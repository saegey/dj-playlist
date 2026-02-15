import { NextResponse } from "next/server";
import { Pool } from "pg";
import { redisJobService } from "@/services/redisJobService";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type TrackRow = {
  track_id: string;
  friend_id: number;
  local_audio_url: string | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const trackId = body?.track_id;
    const friendId = Number(body?.friend_id);
    if (!trackId || Number.isNaN(friendId) || friendId <= 0) {
      return NextResponse.json(
        { error: "track_id and friend_id are required" },
        { status: 400 }
      );
    }

    let localAudioUrl =
      typeof body?.local_audio_url === "string" && body.local_audio_url.trim() !== ""
        ? body.local_audio_url.trim()
        : null;

    if (!localAudioUrl) {
      const { rows } = await pool.query<TrackRow>(
        `
        SELECT track_id, friend_id, local_audio_url
        FROM tracks
        WHERE track_id = $1 AND friend_id = $2
        LIMIT 1
        `,
        [trackId, friendId]
      );
      const track = rows[0];
      if (!track) {
        return NextResponse.json({ error: "Track not found" }, { status: 404 });
      }
      localAudioUrl = track.local_audio_url;
    }

    if (!localAudioUrl) {
      return NextResponse.json(
        { error: "Track has no local audio file to analyze" },
        { status: 400 }
      );
    }

    const jobId = await redisJobService.createAnalyzeLocalJob({
      track_id: trackId,
      friend_id: friendId,
      local_audio_url: localAudioUrl,
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: "Local audio analysis job queued successfully",
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error queueing local analysis job:", err);
    return NextResponse.json(
      { error: err.message || "Failed to queue local analysis job" },
      { status: 500 }
    );
  }
}
