import { NextResponse } from "next/server";
import { redisJobService } from "@/services/redisJobService";

export type JobData = {
  track_id: string;
  friend_id: number;
  apple_music_url?: string;
  spotify_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
  title?: string | null;
  artist?: string | null;
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

    // Convert Redis JobStatus to our JobInfo format
    const formattedJobs: JobInfo[] = jobs.map((job) => ({
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
        friend_id: job.friend_id,
        title:
          typeof job.result?.title === "string"
            ? job.result.title
            : job.track_id,
        artist:
          typeof job.result?.artist === "string"
            ? job.result.artist
            : undefined,
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
    }));

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
