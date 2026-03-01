import { NextRequest, NextResponse } from "next/server";
import { gamdlCookieService } from "@/services/gamdlCookieService";

export const runtime = "nodejs";

/**
 * GET /api/settings/gamdl-cookies
 * Get current cookie file status
 */
export async function GET() {
  try {
    const cookieInfo = await gamdlCookieService.getCookieFileInfo();
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
    const cookieInfo = await gamdlCookieService.uploadCookieFile(file);

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
    await gamdlCookieService.deleteCookieFile();

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
