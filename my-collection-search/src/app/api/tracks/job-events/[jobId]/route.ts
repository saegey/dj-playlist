import { NextRequest, NextResponse } from "next/server";
import {
  getDownloadEvents,
  getAnalyzeEvents,
  QUEUE_NAMES,
  QueueType,
} from "@/queues/audioQueue";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const { searchParams } = new URL(request.url);
  const queueName = searchParams.get("queue") || QUEUE_NAMES.DOWNLOAD_AUDIO;

  if (!jobId) {
    return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
  }

  // Validate queue name
  if (!Object.values(QUEUE_NAMES).includes(queueName as QueueType)) {
    return NextResponse.json({ error: "Invalid queue name" }, { status: 400 });
  }

  // Set up SSE response
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    start(controller) {
      console.log(`Starting SSE stream for job ${jobId} in queue ${queueName}`);

      const events =
        queueName === QUEUE_NAMES.DOWNLOAD_AUDIO
          ? getDownloadEvents()
          : getAnalyzeEvents();

      let isCompleted = false;

      // Helper to send SSE data
      const sendEvent = (eventType: string, data: unknown) => {
        const message = `event: ${eventType}\ndata: ${JSON.stringify(
          data
        )}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Helper to close the stream
      const closeStream = () => {
        if (!isCompleted) {
          isCompleted = true;
          sendEvent("complete", { message: "Stream completed" });
          controller.close();
        }
      };

      // Listen for job progress
      events.on("progress", ({ jobId: eventJobId, data: progress }) => {
        if (eventJobId === jobId && !isCompleted) {
          sendEvent("progress", { jobId: eventJobId, progress });
        }
      });

      // Listen for job completion
      events.on("completed", ({ jobId: eventJobId, returnvalue }) => {
        if (eventJobId === jobId && !isCompleted) {
          sendEvent("completed", { jobId: eventJobId, result: returnvalue });
          closeStream();
        }
      });

      // Listen for job failure
      events.on("failed", ({ jobId: eventJobId, failedReason }) => {
        if (eventJobId === jobId && !isCompleted) {
          sendEvent("failed", { jobId: eventJobId, error: failedReason });
          closeStream();
        }
      });

      // Send initial connection event
      sendEvent("connected", { jobId, queue: queueName });

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        console.log(`SSE stream aborted for job ${jobId}`);
        closeStream();
      });

      // Set a timeout to close the stream after 10 minutes
      const timeout = setTimeout(() => {
        console.log(`SSE stream timeout for job ${jobId}`);
        closeStream();
      }, 10 * 60 * 1000);

      // Clean up timeout when stream closes
      const originalClose = controller.close.bind(controller);
      controller.close = () => {
        clearTimeout(timeout);
        originalClose();
      };
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}
