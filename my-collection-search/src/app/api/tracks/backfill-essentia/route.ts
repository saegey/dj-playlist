import { NextRequest, NextResponse } from "next/server";
import { trackOpsService } from "@/services/trackOpsService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const friendIdRaw = body?.friend_id;
    const friendId =
      friendIdRaw === undefined || friendIdRaw === null || friendIdRaw === ""
        ? null
        : Number(friendIdRaw);
    const force = Boolean(body?.force);

    if (friendIdRaw !== undefined && (friendId === null || Number.isNaN(friendId))) {
      return NextResponse.json({ error: "Invalid friend_id" }, { status: 400 });
    }

    const result = await trackOpsService.queueEssentiaBackfillJobs({
      friend_id: friendId,
      force,
    });

    return NextResponse.json(result);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error queueing Essentia backfill:", err);
    return NextResponse.json(
      { error: err.message || "Failed to queue Essentia backfill" },
      { status: 500 }
    );
  }
}
