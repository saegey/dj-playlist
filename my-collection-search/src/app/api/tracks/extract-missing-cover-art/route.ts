import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { redisJobService } from "@/services/redisJobService";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type TrackRow = {
  track_id: string;
  friend_id: number;
  release_id: string | null;
  missing_tracks: string | number;
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const friendIdRaw = body?.friend_id;
  const friendId =
    friendIdRaw === undefined || friendIdRaw === null || friendIdRaw === ""
      ? null
      : Number(friendIdRaw);

  if (friendIdRaw !== undefined && (friendId === null || Number.isNaN(friendId))) {
    return NextResponse.json({ error: "Invalid friend_id" }, { status: 400 });
  }

  const query = `
    SELECT
      MIN(track_id) AS track_id,
      friend_id,
      release_id::text AS release_id,
      COUNT(*) AS missing_tracks
    FROM tracks
    WHERE local_audio_url IS NOT NULL
      AND local_audio_url <> ''
      AND (audio_file_album_art_url IS NULL OR audio_file_album_art_url = '')
      AND release_id IS NOT NULL
      AND release_id::text <> ''
      ${friendId !== null ? "AND friend_id = $1" : ""}
    GROUP BY friend_id, release_id::text
  `;

  const { rows } = await pool.query<TrackRow>(query, friendId !== null ? [friendId] : []);

  const jobIds: string[] = [];
  const errors: {
    track_id: string;
    friend_id: number;
    release_id: string | null;
    error: string;
  }[] = [];
  let tracksImpacted = 0;

  for (const row of rows) {
    try {
      if (!row.release_id) continue;
      const jobId = await redisJobService.createCoverArtAlbumJob({
        track_id: row.track_id,
        friend_id: row.friend_id,
        release_id: row.release_id,
      });
      jobIds.push(jobId);
      tracksImpacted += Number(row.missing_tracks || 0);
    } catch (err) {
      errors.push({
        track_id: row.track_id,
        friend_id: row.friend_id,
        release_id: row.release_id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    queued: jobIds.length,
    queuedAlbums: jobIds.length,
    tracksImpacted,
    jobIds,
    errors,
  });
}
