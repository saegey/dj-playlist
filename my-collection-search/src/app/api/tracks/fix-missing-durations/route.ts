import { NextResponse } from "next/server";
import { trackOpsService } from "@/server/services/trackOpsService";

export async function POST() {
  try {
    const result = await trackOpsService.queueMissingDurationFixJobs();
    return NextResponse.json(result);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error queueing missing duration fixes:", err);
    return NextResponse.json(
      { error: err.message || "Failed to queue missing duration fixes" },
      { status: 500 }
    );
  }
}
