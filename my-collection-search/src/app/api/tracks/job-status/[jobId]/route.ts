import { NextResponse } from "next/server";
import { getJobStatus, QUEUE_NAMES, QueueType } from "@/queues/audioQueue";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const { searchParams } = new URL(request.url);
    const queueName = searchParams.get("queue") || QUEUE_NAMES.DOWNLOAD_AUDIO;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Validate queue name
    if (!Object.values(QUEUE_NAMES).includes(queueName as QueueType)) {
      return NextResponse.json(
        { error: "Invalid queue name" },
        { status: 400 }
      );
    }

    const jobStatus = await getJobStatus(jobId, queueName);

    if (!jobStatus) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: jobStatus.id,
      name: jobStatus.name,
      state: jobStatus.state,
      progress: jobStatus.progress || 0,
      data: jobStatus.data,
      returnvalue: jobStatus.returnvalue,
      finishedOn: jobStatus.finishedOn,
      failedReason: jobStatus.failedReason,
      attemptsMade: jobStatus.attemptsMade,
      processedOn: jobStatus.processedOn,
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