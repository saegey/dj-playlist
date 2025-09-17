import { NextRequest, NextResponse } from "next/server";
import { redisJobService } from "@/services/redisJobService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
  }

  // Set up SSE response
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    start(controller) {
      console.log(`Starting SSE stream for job ${jobId}`);

      let isCompleted = false;
      let pollInterval = undefined as undefined | NodeJS.Timeout;

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
          if (pollInterval) clearInterval(pollInterval);
          sendEvent("complete", { message: "Stream completed" });
          controller.close();
        }
      };

      // Poll job status every 2 seconds
      const pollJobStatus = async () => {
        if (isCompleted) return;

        try {
          const jobStatus = await redisJobService.getJobStatus(jobId);

          if (!jobStatus) {
            sendEvent("error", { jobId, error: "Job not found" });
            closeStream();
            return;
          }

          // Send progress update
          sendEvent("progress", {
            jobId,
            progress: jobStatus.progress,
            status: jobStatus.status,
          });

          // Check if job is completed or failed
          if (jobStatus.status === "completed") {
            sendEvent("completed", {
              jobId,
              result: jobStatus.result,
            });
            closeStream();
          } else if (jobStatus.status === "failed") {
            sendEvent("failed", {
              jobId,
              error: jobStatus.error,
            });
            closeStream();
          }
        } catch (error) {
          console.error(`Error polling job ${jobId}:`, error);
          sendEvent("error", { jobId, error: "Failed to get job status" });
          closeStream();
        }
      };

      // Send initial connection event
      sendEvent("connected", { jobId });

      // Start polling
      pollJobStatus(); // Initial poll
      pollInterval = setInterval(pollJobStatus, 2000); // Poll every 2 seconds

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
        if (pollInterval) clearInterval(pollInterval);
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
