import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import type { Track } from "@/types/track";
import {
  buildTrackPrompt,
  getDefaultTrackEmbeddingTemplate,
} from "@/lib/track-embedding";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const trackId = (await params).id;
    const friendIdRaw = request.nextUrl.searchParams.get("friend_id");
    const friendId = Number(friendIdRaw);
    if (!trackId || !friendId || Number.isNaN(friendId)) {
      return NextResponse.json(
        { error: "Missing required parameters: track_id and friend_id" },
        { status: 400 }
      );
    }

    const trackRes = await pool.query(
      "SELECT * FROM tracks WHERE track_id = $1 AND friend_id = $2 LIMIT 1",
      [trackId, friendId]
    );
    const track = trackRes.rows[0] as Track | undefined;
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const defaultTemplate = getDefaultTrackEmbeddingTemplate();
    const templateRes = await pool.query(
      "SELECT prompt_template FROM embedding_prompt_settings WHERE friend_id = $1",
      [friendId]
    );
    const template =
      templateRes.rows.length > 0 &&
      typeof templateRes.rows[0].prompt_template === "string"
        ? templateRes.rows[0].prompt_template
        : defaultTemplate;

    const prompt = buildTrackPrompt(track, template);

    return NextResponse.json({
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
