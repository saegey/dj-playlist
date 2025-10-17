import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

/**
 * POST /api/settings/gamdl/reset
 * Reset gamdl settings to defaults for a specific friend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { friend_id } = body;

    if (!friend_id) {
      return NextResponse.json(
        { error: "friend_id is required" },
        { status: 400 }
      );
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Delete existing settings (will trigger recreation with defaults)
    await pool.query(`
      DELETE FROM gamdl_settings WHERE friend_id = $1
    `, [friend_id]);

    // Create new settings with defaults
    const result = await pool.query(`
      INSERT INTO gamdl_settings (friend_id)
      VALUES ($1)
      RETURNING *
    `, [friend_id]);

    await pool.end();

    return NextResponse.json({
      success: true,
      message: "Settings reset to defaults",
      settings: result.rows[0]
    });

  } catch (error) {
    console.error("Failed to reset gamdl settings:", error);
    return NextResponse.json(
      {
        error: "Failed to reset gamdl settings",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}