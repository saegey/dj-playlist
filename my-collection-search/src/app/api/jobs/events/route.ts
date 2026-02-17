import { NextRequest } from "next/server";
import { redisJobService } from "@/services/redisJobService";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode("data: connected\n\n"));

      const knownCompletedJobs = new Set<string>();
      let startedAt = Date.now();

      const checkInterval = setInterval(async () => {
        try {
          const jobs = await redisJobService.getAllJobs();

          // Look for newly completed jobs
          for (const job of jobs) {
            if (
              (job.status === "completed" || job.status === "failed") &&
              job.updated_at >= startedAt &&
              !knownCompletedJobs.has(job.job_id)
            ) {
              knownCompletedJobs.add(job.job_id);

              // Send job completion event
              const eventData = JSON.stringify({
                type: job.status === "completed" ? "job_completed" : "error",
                job_id: job.job_id,
                track_id: job.track_id,
                friend_id: job.friend_id,
                result: job.result,
                message: job.error,
                timestamp: Date.now()
              });

              controller.enqueue(encoder.encode(`data: ${eventData}\n\n`));
            }
          }
          startedAt = Date.now();
        } catch (error) {
          console.error("Error checking jobs in SSE:", error);
          // Send error event but continue
          const errorData = JSON.stringify({
            type: "error",
            message: "Error checking job status",
            timestamp: Date.now()
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        }
      }, 15000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(checkInterval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
