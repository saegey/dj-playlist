import { NextResponse } from "next/server";
import { redisJobService } from "@/services/redisJobService";
import { Pool } from "pg";
import type { JobData, JobInfo } from "@/types/jobs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit") || 100);
    const offsetParam = Number(searchParams.get("offset") || 0);
    const stateParam = (searchParams.get("state") || "all").toLowerCase();
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 500)
      : 100;
    const offset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;

    const allJobs = await redisJobService.getAllJobs();

    const summary = {
      total: allJobs.length,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    };
    for (const job of allJobs) {
      if (job.status === "queued") summary.waiting += 1;
      else if (job.status === "processing") summary.active += 1;
      else if (job.status === "completed") summary.completed += 1;
      else if (job.status === "failed") summary.failed += 1;
    }

    const filteredJobs = allJobs.filter((job) => {
      if (stateParam === "all") return true;
      if (stateParam === "waiting") return job.status === "queued";
      if (stateParam === "active") return job.status === "processing";
      if (stateParam === "completed") return job.status === "completed";
      if (stateParam === "failed") return job.status === "failed";
      return true;
    });
    const jobs = filteredJobs.slice(offset, offset + limit);

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
          SELECT track_id, friend_id, release_id, title, artist, album, year, album_thumbnail,
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
      name: job.name || job.job_type || "download-audio",
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
        release_id:
          (track?.release_id as string | undefined) ||
          (typeof job.release_id === "string" ? job.release_id : undefined),
        job_type: job.job_type || job.name,
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
      summary,
      pagination: {
        limit,
        offset,
        total_filtered: filteredJobs.length,
        has_more: offset + jobs.length < filteredJobs.length,
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
