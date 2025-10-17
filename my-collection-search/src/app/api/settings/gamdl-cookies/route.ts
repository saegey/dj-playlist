import { NextRequest, NextResponse } from "next/server";
import { getCookieFileInfo, saveCookieFile, deleteCookieFile } from "@/lib/cookieUtils";

export const runtime = "nodejs";

/**
 * GET /api/settings/gamdl-cookies
 * Get current cookie file status
 */
export async function GET() {
  try {
    const cookieInfo = await getCookieFileInfo();
    return NextResponse.json(cookieInfo);
  } catch (error) {
    console.error("Failed to get cookie file info:", error);
    return NextResponse.json(
      {
        error: "Failed to get cookie file information",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/gamdl-cookies
 * Upload new cookie file
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("cookieFile");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No cookie file provided" },
        { status: 400 }
      );
    }

    // Validate file type and name
    if (!file.name.endsWith('.txt') && !file.name.includes('cookie')) {
      return NextResponse.json(
        { error: "Please upload a .txt cookie file" },
        { status: 400 }
      );
    }

    // Save and validate the cookie file
    const cookieInfo = await saveCookieFile(file);

    return NextResponse.json({
      success: true,
      message: "Cookie file uploaded successfully",
      cookieInfo
    });

  } catch (error) {
    console.error("Failed to upload cookie file:", error);
    return NextResponse.json(
      {
        error: "Failed to upload cookie file",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/settings/gamdl-cookies
 * Delete current cookie file
 */
export async function DELETE() {
  try {
    await deleteCookieFile();

    return NextResponse.json({
      success: true,
      message: "Cookie file deleted successfully"
    });
  } catch (error) {
    console.error("Failed to delete cookie file:", error);
    return NextResponse.json(
      {
        error: "Failed to delete cookie file",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}