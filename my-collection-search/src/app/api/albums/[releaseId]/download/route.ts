import { NextResponse } from "next/server";
import { Pool } from "pg";
import { redisJobService } from "@/services/redisJobService";

export async function POST(
  request: Request,
  { params }: { params: { releaseId: string } }
) {
  try {
    const { releaseId } = params;
    const { searchParams } = new URL(request.url);
    const friendId = parseInt(searchParams.get("friend_id") || "0");

    if (!friendId) {
      return NextResponse.json(
        { error: "friend_id parameter is required" },
        { status: 400 }
      );
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    try {
      // Get all tracks for this album that are missing local_audio_url
      // and have at least one music service URL
      const result = await pool.query(
        `SELECT track_id, friend_id, apple_music_url, youtube_url,
                soundcloud_url, spotify_url, title, artist
         FROM tracks
         WHERE release_id = $1
           AND friend_id = $2
           AND (local_audio_url IS NULL OR local_audio_url = '')
           AND (
             apple_music_url IS NOT NULL OR
             youtube_url IS NOT NULL OR
             soundcloud_url IS NOT NULL OR
             spotify_url IS NOT NULL
           )
         ORDER BY position`,
        [releaseId, friendId]
      );

      const tracks = result.rows;

      if (tracks.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No tracks need downloading",
          jobIds: [],
          tracksQueued: 0,
        });
      }

      // Enqueue download job for each track
      const jobIds: string[] = [];
      for (const track of tracks) {
        const jobId = await redisJobService.createDownloadJob({
          track_id: track.track_id,
          friend_id: track.friend_id,
          apple_music_url: track.apple_music_url,
          youtube_url: track.youtube_url,
          soundcloud_url: track.soundcloud_url,
          spotify_url: track.spotify_url,
          title: track.title,
          artist: track.artist,
        });
        jobIds.push(jobId);
      }

      console.log(
        `Queued ${jobIds.length} download jobs for album ${releaseId}`
      );

      return NextResponse.json({
        success: true,
        message: `Queued ${jobIds.length} track${jobIds.length === 1 ? "" : "s"} for download`,
        jobIds,
        tracksQueued: jobIds.length,
      });
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error("Error enqueuing album downloads:", error);
    return NextResponse.json(
      {
        error: "Failed to enqueue downloads",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
