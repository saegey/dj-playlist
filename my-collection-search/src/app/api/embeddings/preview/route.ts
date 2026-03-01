import { NextRequest, NextResponse } from "next/server";
import {
  embeddingsService,
  type EmbeddingPreviewType,
} from "@/server/services/embeddingsService";

function parsePreviewType(value: string | null): EmbeddingPreviewType | null {
  if (value === "identity" || value === "audio_vibe") return value;
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trackId = searchParams.get("track_id");
    const friendIdRaw = searchParams.get("friend_id");
    const previewType = parsePreviewType(searchParams.get("type"));

    if (!trackId || !friendIdRaw || !previewType) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid params. Required: track_id, friend_id, type=identity|audio_vibe",
        },
        { status: 400 }
      );
    }

    const friendId = Number.parseInt(friendIdRaw, 10);
    if (Number.isNaN(friendId)) {
      return NextResponse.json({ error: "Invalid friend_id" }, { status: 400 });
    }

    const preview = await embeddingsService.getPreview(previewType, trackId, friendId);
    return NextResponse.json(preview);
  } catch (error) {
    console.error("[Embeddings Preview] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate preview",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
