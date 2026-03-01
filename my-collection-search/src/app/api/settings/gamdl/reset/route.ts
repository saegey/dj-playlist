import { NextRequest, NextResponse } from "next/server";
import { settingsService } from "@/services/settingsService";

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

    const friendIdNum = Number(friend_id);
    if (!friendIdNum || Number.isNaN(friendIdNum)) {
      return NextResponse.json(
        { error: "friend_id must be a number" },
        { status: 400 }
      );
    }

    const settings = await settingsService.resetGamdlSettings(friendIdNum);

    return NextResponse.json({
      success: true,
      message: "Settings reset to defaults",
      settings,
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
