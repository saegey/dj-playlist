import { NextRequest } from "next/server";
import { friendService } from "@/server/services/friendService";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const username = searchParams.get("username");

  if (!username || typeof username !== "string") {
    return new Response("event: error\ndata: Missing or invalid username\n\n", {
      status: 400,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(`data: Adding friend '${username}'...\n\n`)
        );
        controller.enqueue(encoder.encode(`data: Checking database...\n\n`));
        await friendService.addFriend(username);
        controller.enqueue(
          encoder.encode(`data: Friend '${username}' added.\n\n`)
        );
        // Signal completion
        controller.enqueue(encoder.encode(`data: {\"done\":true}\n\n`));
        controller.close();
      } catch (e) {
        controller.enqueue(
          encoder.encode(
            `data: Error: ${e instanceof Error ? e.message : String(e)}\n\n`
          )
        );
        controller.enqueue(encoder.encode(`data: {\"done\":true}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
