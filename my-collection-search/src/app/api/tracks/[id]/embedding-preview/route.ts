import { NextRequest, NextResponse } from "next/server";
import {
  buildTrackPrompt,
  getDefaultTrackEmbeddingTemplate,
} from "@/lib/track-embedding";
import { embeddingsService } from "@/server/services/embeddingsService";
import { trackRepository } from "@/server/repositories/trackRepository";

type PreviewType = "prompt" | "identity" | "audio_vibe";

function parsePreviewType(value: string | null): PreviewType {
  if (value === "identity" || value === "audio_vibe" || value === "prompt") {
    return value;
  }
  return "prompt";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const trackId = (await params).id;
    const friendIdRaw = request.nextUrl.searchParams.get("friend_id");
    const previewType = parsePreviewType(request.nextUrl.searchParams.get("type"));
    const friendId = Number(friendIdRaw);
    if (!trackId || !friendId || Number.isNaN(friendId)) {
      return NextResponse.json(
        { error: "Missing required parameters: id and friend_id" },
        { status: 400 }
      );
    }

    if (previewType === "identity" || previewType === "audio_vibe") {
      const preview = await embeddingsService.getPreview(
        previewType,
        trackId,
        friendId
      );
      return NextResponse.json(preview);
    }

    const track = await trackRepository.findTrackByTrackIdAndFriendIdRaw(
      trackId,
      friendId
    );
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const defaultTemplate = getDefaultTrackEmbeddingTemplate();
    const template =
      (await trackRepository.findEmbeddingPromptTemplateByFriendId(friendId)) ??
      defaultTemplate;

    const prompt = buildTrackPrompt(track, template);

    return NextResponse.json({
      type: "prompt",
      track_id: trackId,
      friend_id: friendId,
      isDefaultTemplate: template === defaultTemplate,
      template,
      prompt,
    });
  } catch (error) {
    console.error("Failed to build embedding preview:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
