import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import {
  getDefaultTrackEmbeddingTemplate,
  invalidateTrackEmbeddingTemplateCache,
} from "@/lib/track-embedding";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
  const friendIdParam = request.nextUrl.searchParams.get("friend_id");
  const friendId = friendIdParam ? Number(friendIdParam) : undefined;
  const defaultTemplate = getDefaultTrackEmbeddingTemplate();

  if (!friendId || Number.isNaN(friendId)) {
    return NextResponse.json({
      template: defaultTemplate,
      defaultTemplate,
      isDefault: true,
    });
  }

  try {
    const { rows } = await pool.query(
      "SELECT prompt_template FROM embedding_prompt_settings WHERE friend_id = $1",
      [friendId]
    );
    if (rows.length > 0 && typeof rows[0].prompt_template === "string") {
      return NextResponse.json({
        template: rows[0].prompt_template,
        defaultTemplate,
        isDefault: false,
      });
    }
    return NextResponse.json({
      template: defaultTemplate,
      defaultTemplate,
      isDefault: true,
    });
  } catch (err) {
    console.error("Failed to load embedding prompt settings:", err);
    return NextResponse.json(
      { error: "Failed to load embedding prompt settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const friendId = Number(body?.friend_id);
    const template = String(body?.template ?? "").trim();

    if (!friendId || Number.isNaN(friendId)) {
      return NextResponse.json(
        { error: "friend_id is required" },
        { status: 400 }
      );
    }

    if (!template) {
      await pool.query(
        "DELETE FROM embedding_prompt_settings WHERE friend_id = $1",
        [friendId]
      );
      invalidateTrackEmbeddingTemplateCache(friendId);
      return NextResponse.json({
        template: getDefaultTrackEmbeddingTemplate(),
        isDefault: true,
      });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO embedding_prompt_settings (friend_id, prompt_template, updated_at)
      VALUES ($1, $2, current_timestamp)
      ON CONFLICT (friend_id)
      DO UPDATE SET prompt_template = EXCLUDED.prompt_template, updated_at = current_timestamp
      RETURNING prompt_template
      `,
      [friendId, template]
    );
    invalidateTrackEmbeddingTemplateCache(friendId);

    return NextResponse.json({
      template: rows[0]?.prompt_template ?? template,
      isDefault: false,
    });
  } catch (err) {
    console.error("Failed to update embedding prompt settings:", err);
    return NextResponse.json(
      { error: "Failed to update embedding prompt settings" },
      { status: 500 }
    );
  }
}
