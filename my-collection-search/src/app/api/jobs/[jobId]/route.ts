import { NextResponse } from "next/server";
import { redisJobService } from "@/services/redisJobService";

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

    const jobStatus = await redisJobService.getJobStatus(jobId);

    if (!jobStatus) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const jobDetails = {
      id: jobStatus.job_id,
      name: "download-audio",
      state: jobStatus.status === 'queued' ? 'waiting' :
             jobStatus.status === 'processing' ? 'active' :
             jobStatus.status,
      queue: "download",
      data: {
        track_id: jobStatus.track_id,
        friend_id: jobStatus.friend_id,
      },
      progress: jobStatus.progress || 0,
      returnvalue: jobStatus.result,
      finishedOn: jobStatus.status === 'completed' || jobStatus.status === 'failed' ? jobStatus.updated_at : undefined,
      processedOn: jobStatus.status === 'processing' || jobStatus.status === 'completed' || jobStatus.status === 'failed' ? jobStatus.updated_at : undefined,
      failedReason: jobStatus.error,
      attemptsMade: 1,
      delay: 0,
      timestamp: jobStatus.created_at,
      opts: {},
      logs: [],
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