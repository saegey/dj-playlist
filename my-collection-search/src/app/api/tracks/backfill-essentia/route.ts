import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getEssentiaAnalysisPath } from "@/lib/essentia-storage";
import { redisJobService } from "@/services/redisJobService";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type TrackRow = {
  track_id: string;
  friend_id: number;
  local_audio_url: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const friendIdRaw = body?.friend_id;
    const friendId =
      friendIdRaw === undefined || friendIdRaw === null || friendIdRaw === ""
        ? null
        : Number(friendIdRaw);
    const force = Boolean(body?.force);

    if (friendIdRaw !== undefined && (friendId === null || Number.isNaN(friendId))) {
      return NextResponse.json({ error: "Invalid friend_id" }, { status: 400 });
    }

    const query = `
      SELECT track_id, friend_id, local_audio_url
      FROM tracks
      WHERE local_audio_url IS NOT NULL
        AND local_audio_url <> ''
        ${friendId !== null ? "AND friend_id = $1" : ""}
      ORDER BY friend_id, track_id
    `;

    const { rows } = await pool.query<TrackRow>(
      query,
      friendId !== null ? [friendId] : []
    );

    const jobIds: string[] = [];
    const errors: {
      track_id: string;
      friend_id: number;
      error: string;
    }[] = [];
    let skippedExisting = 0;

    for (const row of rows) {
      try {
        if (!row.local_audio_url) continue;
        if (!force) {
          const analysisPath = getEssentiaAnalysisPath(row.track_id, row.friend_id);
          if (fs.existsSync(analysisPath)) {
            skippedExisting += 1;
            continue;
          }
        }

        const jobId = await redisJobService.createAnalyzeLocalJob({
          track_id: row.track_id,
          friend_id: row.friend_id,
          local_audio_url: row.local_audio_url,
        });
        jobIds.push(jobId);
      } catch (err) {
        errors.push({
          track_id: row.track_id,
          friend_id: row.friend_id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      queued: jobIds.length,
      skipped_existing: skippedExisting,
      total_candidates: rows.length,
      force,
      jobIds,
      errors,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error queueing Essentia backfill:", err);
    return NextResponse.json(
      { error: err.message || "Failed to queue Essentia backfill" },
      { status: 500 }
    );
  }
}
