import { NextResponse } from "next/server";
import { addDownloadJob, JOB_PRIORITIES } from "@/queues/audioQueue";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      apple_music_url,
      youtube_url,
      soundcloud_url,
      track_id,
      friend_id,
      spotify_url,
      preferred_downloader
    } = body;

    // Validate required fields
    if (!track_id || !friend_id) {
      return NextResponse.json(
        { error: "track_id and friend_id are required" },
        { status: 400 }
      );
    }

    // Validate that at least one URL is provided
    if (!apple_music_url && !youtube_url && !soundcloud_url && !spotify_url) {
      return NextResponse.json(
        { error: "At least one music service URL is required" },
        { status: 400 }
      );
    }

    console.log(`Queueing download job for track ${track_id}`);

    // Add job to download queue
    const jobId = await addDownloadJob(
      {
        track_id,
        friend_id: parseInt(friend_id, 10),
        apple_music_url,
        spotify_url,
        youtube_url,
        soundcloud_url,
        preferred_downloader
      },
      JOB_PRIORITIES.NORMAL
    );

    return NextResponse.json({
      success: true,
      jobId,
      message: "Audio processing job queued successfully",
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error queueing analyze job:", err);
    return NextResponse.json(
      { error: err.message || "Failed to queue processing job" },
      { status: 500 }
    );
  }
}