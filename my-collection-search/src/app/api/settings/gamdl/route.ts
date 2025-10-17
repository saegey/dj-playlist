import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

/**
 * GET /api/settings/gamdl?friend_id=123
 * Get gamdl settings for a specific friend
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const friendId = searchParams.get("friend_id");

  if (!friendId) {
    return NextResponse.json(
      { error: "friend_id parameter is required" },
      { status: 400 }
    );
  }

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Get settings for the friend, create with defaults if not exists
    await pool.query(`
      INSERT INTO gamdl_settings (friend_id)
      VALUES ($1)
      ON CONFLICT (friend_id) DO NOTHING
    `, [friendId]);

    // Now get the settings (either just created or existing)
    const settingsResult = await pool.query(`
      SELECT * FROM gamdl_settings WHERE friend_id = $1
    `, [friendId]);

    if (settingsResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to create or retrieve settings" },
        { status: 500 }
      );
    }

    await pool.end();

    return NextResponse.json({
      settings: settingsResult.rows[0]
    });

  } catch (error) {
    console.error("Failed to get gamdl settings:", error);
    return NextResponse.json(
      {
        error: "Failed to get gamdl settings",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/gamdl
 * Update gamdl settings for a specific friend
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { friend_id, ...updates } = body;

    if (!friend_id) {
      return NextResponse.json(
        { error: "friend_id is required" },
        { status: 400 }
      );
    }

    // Validate update fields
    const allowedFields = [
      'audio_quality', 'audio_format', 'save_cover', 'cover_format',
      'save_lyrics', 'lyrics_format', 'overwrite_existing',
      'skip_music_videos', 'max_retries'
    ];

    const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Ensure settings exist for this friend
    await pool.query(`
      INSERT INTO gamdl_settings (friend_id)
      VALUES ($1)
      ON CONFLICT (friend_id) DO NOTHING
    `, [friend_id]);

    // Build dynamic update query
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [friend_id, ...updateFields.map(field => updates[field])];

    const updateQuery = `
      UPDATE gamdl_settings
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE friend_id = $1
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Settings not found" },
        { status: 404 }
      );
    }

    await pool.end();

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: result.rows[0]
    });

  } catch (error) {
    console.error("Failed to update gamdl settings:", error);
    return NextResponse.json(
      {
        error: "Failed to update gamdl settings",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}