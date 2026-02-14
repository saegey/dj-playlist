import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getDefaultTrackMetadataPrompt } from "@/lib/serverPrompts";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
  const friendIdParam = request.nextUrl.searchParams.get("friend_id");
  const friendId = friendIdParam ? Number(friendIdParam) : undefined;
  const defaultPrompt = getDefaultTrackMetadataPrompt();

  if (!friendId || Number.isNaN(friendId)) {
    return NextResponse.json({
      prompt: defaultPrompt,
      defaultPrompt,
      isDefault: true,
    });
  }

  try {
    const { rows } = await pool.query(
      "SELECT prompt FROM ai_prompt_settings WHERE friend_id = $1",
      [friendId]
    );
    if (rows.length > 0 && typeof rows[0].prompt === "string") {
      return NextResponse.json({
        prompt: rows[0].prompt,
        defaultPrompt,
        isDefault: false,
      });
    }
    return NextResponse.json({
      prompt: defaultPrompt,
      defaultPrompt,
      isDefault: true,
    });
  } catch (err) {
    console.error("Failed to load AI prompt settings:", err);
    return NextResponse.json(
      { error: "Failed to load AI prompt settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const friendId = Number(body?.friend_id);
    const prompt = String(body?.prompt ?? "").trim();

    if (!friendId || Number.isNaN(friendId)) {
      return NextResponse.json(
        { error: "friend_id is required" },
        { status: 400 }
      );
    }

    if (!prompt) {
      await pool.query("DELETE FROM ai_prompt_settings WHERE friend_id = $1", [
        friendId,
      ]);
      return NextResponse.json({
        prompt: getDefaultTrackMetadataPrompt(),
        isDefault: true,
      });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO ai_prompt_settings (friend_id, prompt, updated_at)
      VALUES ($1, $2, current_timestamp)
      ON CONFLICT (friend_id)
      DO UPDATE SET prompt = EXCLUDED.prompt, updated_at = current_timestamp
      RETURNING prompt
      `,
      [friendId, prompt]
    );

    return NextResponse.json({
      prompt: rows[0]?.prompt ?? prompt,
      isDefault: false,
    });
  } catch (err) {
    console.error("Failed to update AI prompt settings:", err);
    return NextResponse.json(
      { error: "Failed to update AI prompt settings" },
      { status: 500 }
    );
  }
}
