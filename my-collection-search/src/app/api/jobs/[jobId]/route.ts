import { NextResponse } from "next/server";
import { getDownloadQueue, getAnalyzeQueue } from "@/queues/audioQueue";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Try to find the job in both queues
    const downloadQueue = getDownloadQueue();
    const analyzeQueue = getAnalyzeQueue();

    let job = await downloadQueue.getJob(jobId);
    let queueType = "download";

    if (!job) {
      job = await analyzeQueue.getJob(jobId);
      queueType = "analyze";
    }

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Get job state
    const state = await job.getState();

    const jobDetails = {
      id: job.id,
      name: job.name,
      state,
      queue: queueType,
      data: job.data,
      progress: job.progress || 0,
      returnvalue: job.returnvalue,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade || 0,
      delay: job.delay,
      timestamp: job.timestamp,
      opts: job.opts,
      // Add logs if available
      logs: job.log || [],
    };

    return NextResponse.json(jobDetails);

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error fetching job details:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch job details" },
      { status: 500 }
    );
  }
}