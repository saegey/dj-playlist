import { NextResponse } from "next/server";
import { trackOpsService } from "@/server/services/trackOpsService";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { track_id?: string; friend_id?: number };
    const track_id = body?.track_id;
    const friend_id = body?.friend_id;

    if (!track_id || typeof friend_id !== "number") {
      return NextResponse.json(
        { error: "track_id and friend_id are required" },
        { status: 400 }
      );
    }

    const result = await trackOpsService.queueDurationFixForTrack({
      track_id,
      friend_id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code });
    }
    return NextResponse.json(result);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error fixing duration:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fix duration" },
      { status: 500 }
    );
  }
}
