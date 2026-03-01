import { NextResponse } from "next/server";
import { redisJobService } from "@/server/services/redisJobService";
import { trackRepository } from "@/server/repositories/trackRepository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const trackId = body?.track_id;
    const friendId = Number(body?.friend_id);
    if (!trackId || Number.isNaN(friendId) || friendId <= 0) {
      return NextResponse.json(
        { error: "track_id and friend_id are required" },
        { status: 400 }
      );
    }

    let localAudioUrl =
      typeof body?.local_audio_url === "string" && body.local_audio_url.trim() !== ""
        ? body.local_audio_url.trim()
        : null;

    if (!localAudioUrl) {
      const track = await trackRepository.findTrackWithLocalAudio(
        trackId,
        friendId
      );
      if (!track) {
        return NextResponse.json({ error: "Track not found" }, { status: 404 });
      }
      localAudioUrl = track.local_audio_url;
    }

    if (!localAudioUrl) {
      return NextResponse.json(
        { error: "Track has no local audio file to analyze" },
        { status: 400 }
      );
    }

    const jobId = await redisJobService.createAnalyzeLocalJob({
      track_id: trackId,
      friend_id: friendId,
      local_audio_url: localAudioUrl,
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: "Local audio analysis job queued successfully",
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error queueing local analysis job:", err);
    return NextResponse.json(
      { error: err.message || "Failed to queue local analysis job" },
      { status: 500 }
    );
  }
}
