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

    // Convert Redis format to expected format
    return NextResponse.json({
      id: jobStatus.job_id,
      name: "download-audio",
      state: jobStatus.status === 'queued' ? 'waiting' :
             jobStatus.status === 'processing' ? 'active' :
             jobStatus.status,
      progress: jobStatus.progress || 0,
      data: {
        track_id: jobStatus.track_id,
        friend_id: jobStatus.friend_id,
      },
      returnvalue: jobStatus.result,
      finishedOn: jobStatus.status === 'completed' || jobStatus.status === 'failed' ? jobStatus.updated_at : undefined,
      failedReason: jobStatus.error,
      attemptsMade: 1,
      processedOn: jobStatus.status === 'processing' || jobStatus.status === 'completed' || jobStatus.status === 'failed' ? jobStatus.updated_at : undefined,
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error getting job status:", err);
    return NextResponse.json(
      { error: err.message || "Failed to get job status" },
      { status: 500 }
    );
  }
}