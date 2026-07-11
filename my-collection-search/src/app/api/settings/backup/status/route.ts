import { NextResponse } from "next/server";
import { backupStatusService } from "@/server/services/backupStatusService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const status = backupStatusService.getStatus();
    return NextResponse.json({ status });
  } catch (error) {
    console.error("Failed to get backup status:", error);
    return NextResponse.json(
      { error: "Failed to get backup status" },
      { status: 500 }
    );
  }
}
