import { NextResponse } from "next/server";

import { getDownloadQueue, getAnalyzeQueue } from "@/queues/audioQueue";
import { AnalysisResult } from "@/services/analysisService";

export type JobReturnValue =
  | { success: true; analysisResult?: AnalysisResult; local_audio_url?: string }
  | { success: false; error?: string }
  | undefined;

export type JobData = {
  track_id: string;
  friend_id: number;
  apple_music_url?: string;
  spotify_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
};

export interface JobInfo {
  id: string;
  name: string;
  state: string;
  progress: number;
  data: JobData;
  returnvalue?: JobReturnValue;
  finishedOn?: number;
  failedReason?: string;
  attemptsMade: number;
  processedOn?: number;
  queue: string;
}

export async function DELETE() {
  try {
    const downloadQueue = getDownloadQueue();
    const analyzeQueue = getAnalyzeQueue();

    // Clear all jobs from both queues
    await Promise.all([
      downloadQueue.obliterate({ force: true }),
      analyzeQueue.obliterate({ force: true }),
    ]);

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
    const downloadQueue = getDownloadQueue();
    const analyzeQueue = getAnalyzeQueue();

    // Get jobs from both queues (increased limits to see more jobs)
    const [downloadJobs, analyzeJobs] = await Promise.all([
      Promise.all([
        downloadQueue.getWaiting(),
        downloadQueue.getActive(),
        downloadQueue.getCompleted(0, 100), // Show more completed jobs
        downloadQueue.getFailed(0, 100), // Show more failed jobs
      ]),
      Promise.all([
        analyzeQueue.getWaiting(),
        analyzeQueue.getActive(),
        analyzeQueue.getCompleted(0, 100),
        analyzeQueue.getFailed(0, 100),
      ]),
    ]);

    // Format download jobs
    const allDownloadJobs = [
      ...downloadJobs[0], // waiting
      ...downloadJobs[1], // active
      ...downloadJobs[2], // completed
      ...downloadJobs[3], // failed
    ];

    // Format analyze jobs
    const allAnalyzeJobs = [
      ...analyzeJobs[0], // waiting
      ...analyzeJobs[1], // active
      ...analyzeJobs[2], // completed
      ...analyzeJobs[3], // failed
    ];

    // Convert to our JobInfo format
    const formatJob = (
      job: {
        id: string;
        name: string;
        data: JobData;
        progress?: number;
        returnvalue?: JobReturnValue;
        finishedOn?: number;
        failedReason?: string;
        attemptsMade?: number;
        processedOn?: number;
      },
      queue: string
    ): JobInfo => ({
      id: job.id,
      name: job.name,
      state: job.finishedOn
        ? job.failedReason
          ? "failed"
          : "completed"
        : job.processedOn
        ? "active"
        : "waiting",
      progress: job.progress || 0,
      data: job.data,
      returnvalue: job.returnvalue,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade || 0,
      processedOn: job.processedOn,
      queue,
    });

    const formattedDownloadJobs = allDownloadJobs.map((job) =>
      formatJob(
        {
          id: job.id ?? "",
          name: job.name ?? "",
          data: job.data,
          progress: typeof job.progress === "number" ? job.progress : Number(job.progress) || 0,
          returnvalue: job.returnvalue,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade,
          processedOn: job.processedOn,
        },
        "download"
      )
    );
    const formattedAnalyzeJobs = allAnalyzeJobs.map((job) =>
      formatJob(
        {
          id: job.id ?? "",
          name: job.name ?? "",
          data: job.data,
          progress: typeof job.progress === "number" ? job.progress : Number(job.progress) || 0,
          returnvalue: job.returnvalue,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade,
          processedOn: job.processedOn,
        },
        "analyze"
      )
    );

    // Combine and sort by most recent first
    const allJobs = [...formattedDownloadJobs, ...formattedAnalyzeJobs].sort(
      (a, b) => {
        const aTime = a.finishedOn || a.processedOn || Date.now();
        const bTime = b.finishedOn || b.processedOn || Date.now();
        return bTime - aTime;
      }
    );

    return NextResponse.json({
      jobs: allJobs,
      summary: {
        total: allJobs.length,
        waiting: allJobs.filter((j) => j.state === "waiting").length,
        active: allJobs.filter((j) => j.state === "active").length,
        completed: allJobs.filter((j) => j.state === "completed").length,
        failed: allJobs.filter((j) => j.state === "failed").length,
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
