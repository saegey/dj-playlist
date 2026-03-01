import { NextResponse } from "next/server";
import { gamdlConnectionTestService } from "@/server/services/gamdlConnectionTestService";
import type { GamdlConnectionTestDetails } from "@/types/gamdl";

export const runtime = "nodejs";

/**
 * POST /api/settings/gamdl/test
 * Test gamdl setup and connection
 */
export async function POST() {
  try {
    const result = await gamdlConnectionTestService.testConnection();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to test gamdl connection:", error);
    const details: GamdlConnectionTestDetails = {
      error_type: "test_error",
      gamdl_available: false,
      cookie_file_exists: false,
      cookie_file_valid: false,
      test_download_attempted: false,
      test_download_success: false,
    };

    return NextResponse.json(
      {
        success: false,
        message: "Failed to test gamdl connection",
        details,
      },
      { status: 500 }
    );
  }
}
