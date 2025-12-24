import { localPlaybackService } from '@/services/localPlaybackService';

export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events (SSE) endpoint for real-time MPD status updates
 * Replaces inefficient HTTP polling with push-based streaming
 *
 * Client connects once and receives status updates as they happen
 */
export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      console.log('[SSE] Client connected');

      let isActive = true;

      // Cleanup function
      const cleanup = () => {
        isActive = false;
        console.log('[SSE] Client disconnected');
      };

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup);

      // Send status updates every second while client is connected
      const sendStatus = async () => {
        if (!isActive) return;

        try {
          const status = await localPlaybackService.getStatus();
          const data = JSON.stringify(status);

          // SSE format: "data: {json}\n\n"
          controller.enqueue(
            encoder.encode(`data: ${data}\n\n`)
          );
        } catch (error) {
          console.error('[SSE] Failed to get status:', error);
        }

        // Schedule next update
        if (isActive) {
          setTimeout(sendStatus, 1000);
        }
      };

      // Send initial status and start update loop
      await sendStatus();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
