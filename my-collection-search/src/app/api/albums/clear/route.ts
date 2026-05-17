import { NextResponse } from "next/server";
import { albumRepository } from "@/server/repositories/albumRepository";

/**
 * DELETE endpoint to clear all albums from PostgreSQL
 * Use this before re-backfilling with corrected data
 */
export async function DELETE() {
  try {
    // Clear PostgreSQL albums table
    console.log("[Clear Albums] Deleting all albums from PostgreSQL...");
    const deletedCount = await albumRepository.deleteAllAlbums();
    console.log(
      `[Clear Albums] Deleted ${deletedCount} albums from PostgreSQL`
    );

    return NextResponse.json({
      success: true,
      deletedFromPostgres: deletedCount,
      message: "All albums cleared. Ready to re-backfill.",
    });
  } catch (error) {
    console.error("[Clear Albums] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
