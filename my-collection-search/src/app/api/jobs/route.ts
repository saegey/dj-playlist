import { NextResponse } from "next/server";
import { redisJobService } from "@/services/redisJobService";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type JobData = {
  track_id: string;
  friend_id: number;
  apple_music_url?: string;
  spotify_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
  title?: string | null;
  artist?: string | null;
  album?: string | null;
  year?: string | number | null;
  album_thumbnail?: string | null;
  discogs_url?: string | null;
  local_audio_url?: string | null;
  library_identifier?: string | null;
  username?: string | null;
};

export interface JobInfo {
  id: string;
  name: string;
  state: string;
  progress: number;
  data: JobData;
  finishedOn?: number;
  failedReason?: string;
  attemptsMade: number;
  processedOn?: number;
  queue: string;
}

export async function DELETE() {
  try {
    await redisJobService.clearAllJobs();

    return NextResponse.json({
      success: true,
      message: "All queue data cleared successfully",
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error clearing queues:", err);
    return NextResponse.json(
      { error: err.message || "Failed to clear queues" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const jobs = await redisJobService.getAllJobs();
    const summary = await redisJobService.getJobSummary();

    const validJobs = jobs.filter(
      (job) => job.track_id && Number.isFinite(job.friend_id)
    );
    const pairKeys = Array.from(
      new Map(
        validJobs.map((job) => [`${job.track_id}:${job.friend_id}`, job])
      ).values()
    );
    const trackMap = new Map<string, Record<string, unknown>>();

    if (pairKeys.length > 0) {
      const values: string[] = [];
      const params: Array<string | number> = [];
      pairKeys.forEach((job, idx) => {
        const offset = idx * 2;
        values.push(`($${offset + 1}, $${offset + 2})`);
        params.push(job.track_id, job.friend_id);
      });

      const { rows } = await pool.query(
        `
          SELECT track_id, friend_id, title, artist, album, year, album_thumbnail,
                 discogs_url, apple_music_url, spotify_url, youtube_url, soundcloud_url,
                 local_audio_url, library_identifier, username
          FROM tracks
          WHERE (track_id, friend_id) IN (${values.join(", ")})
        `,
        params
      );

      rows.forEach((row) => {
        trackMap.set(`${row.track_id}:${row.friend_id}`, row);
      });
    }

    // Convert Redis JobStatus to our JobInfo format
    const formattedJobs: JobInfo[] = jobs.map((job) => {
      const safeFriendId = Number.isFinite(job.friend_id) ? job.friend_id : 0;
      const track = trackMap.get(`${job.track_id}:${job.friend_id}`);
      return {
      id: job.job_id,
      name: "download-audio",
      state:
        job.status === "queued"
          ? "waiting"
          : job.status === "processing"
          ? "active"
          : job.status,
      progress: job.progress,
      data: {
        track_id: job.track_id,
        friend_id: safeFriendId,
        title:
          typeof job.result?.title === "string"
            ? job.result.title
            : (track?.title as string | undefined) || job.track_id,
        artist:
          typeof job.result?.artist === "string"
            ? job.result.artist
            : (track?.artist as string | undefined),
        album: (track?.album as string | undefined),
        year: (track?.year as string | number | undefined),
        album_thumbnail: (track?.album_thumbnail as string | undefined),
        discogs_url: (track?.discogs_url as string | undefined),
        apple_music_url: (track?.apple_music_url as string | undefined),
        spotify_url: (track?.spotify_url as string | undefined),
        youtube_url: (track?.youtube_url as string | undefined),
        soundcloud_url: (track?.soundcloud_url as string | undefined),
        local_audio_url: (track?.local_audio_url as string | undefined),
        library_identifier: (track?.library_identifier as string | undefined),
        username: (track?.username as string | undefined),
      },
      returnvalue: job.result,
      finishedOn:
        job.status === "completed" || job.status === "failed"
          ? job.updated_at
          : undefined,
      failedReason: job.error,
      attemptsMade: 1, // Default for now
      processedOn:
        job.status === "processing" ||
        job.status === "completed" ||
        job.status === "failed"
          ? job.updated_at
          : undefined,
      queue: "download",
    };
    });

    return NextResponse.json({
      jobs: formattedJobs,
      summary: {
        total: summary.total,
        waiting: summary.queued,
        active: summary.processing,
        completed: summary.completed,
        failed: summary.failed,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error fetching jobs:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
