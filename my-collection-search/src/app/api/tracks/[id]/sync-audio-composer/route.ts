import { NextRequest, NextResponse } from "next/server";
import { trackRepository } from "@/services/trackRepository";
import { trackAudioMetadataService } from "@/services/trackAudioMetadataService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const trackId = (await params).id;
    const body = await request.json().catch(() => ({}));
    const friendId = Number(body?.friend_id);

    if (!trackId || !friendId || Number.isNaN(friendId)) {
      return NextResponse.json(
        { error: "Missing required parameters: track_id and friend_id" },
        { status: 400 }
      );
    }

    const track = await trackRepository.findTrackAudioMetadata(trackId, friendId);
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }
    if (!track.local_audio_url) {
      return NextResponse.json(
        { error: "Track has no local_audio_url" },
        { status: 404 }
      );
    }

    const audioPath = trackAudioMetadataService.resolveAudioFilePath(
      track.local_audio_url
    );
    if (!audioPath) {
      return NextResponse.json(
        { error: "Local audio file not found" },
        { status: 404 }
      );
    }

    const probe = await trackAudioMetadataService.runFfprobe(
      audioPath,
      "format_tags"
    );
    const composer = trackAudioMetadataService.extractComposerFromProbe(probe);

    if (!composer) {
      return NextResponse.json(
        { error: "No composer tag found in audio metadata" },
        { status: 404 }
      );
    }

    await trackRepository.updateTrackComposer(trackId, friendId, composer);

    // Update MeiliSearch
    try {
      const updatedTrack =
        await trackRepository.findTrackByTrackIdAndFriendIdWithLibraryFallback(
          trackId,
          friendId
        );
      if (updatedTrack) {
        const { getMeiliClient } = await import("@/lib/meili");
        const meiliClient = getMeiliClient();
        const index = meiliClient.index("tracks");
        await index.updateDocuments([updatedTrack]);
      }
    } catch (meiliErr) {
      console.warn("Failed to update MeiliSearch track composer field:", meiliErr);
    }

    return NextResponse.json({
      success: true,
      composer,
      previous_composer: track.composer ?? null,
      message: "Synced track composer from audio metadata",
    });
  } catch (error) {
    console.error("Error syncing track composer from audio metadata:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
