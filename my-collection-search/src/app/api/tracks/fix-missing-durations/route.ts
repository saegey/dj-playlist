import { NextResponse } from "next/server";
import { Pool } from "pg";
import { redisJobService } from "@/services/redisJobService";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST() {
  const { rows } = await pool.query(
    "SELECT track_id, friend_id, local_audio_url FROM tracks WHERE duration_seconds IS NULL AND local_audio_url LIKE '%.m4a'"
  );

  const jobIds: string[] = [];
  const errors: { track_id: string; error: string }[] = [];

  for (const row of rows) {
    try {
      const jobId = await redisJobService.createDurationJob({
        track_id: row.track_id,
        friend_id: row.friend_id,
        local_audio_url: row.local_audio_url,
      });
      jobIds.push(jobId);
    } catch (err) {
      errors.push({
        track_id: row.track_id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ queued: jobIds.length, jobIds, errors });
}
