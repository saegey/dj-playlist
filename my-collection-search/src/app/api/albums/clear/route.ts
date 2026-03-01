import { NextResponse } from "next/server";
import { getMeiliClient } from "@/lib/meili";
import { albumRepository } from "@/server/repositories/albumRepository";

/**
 * DELETE endpoint to clear all albums from both PostgreSQL and MeiliSearch
 * Use this before re-backfilling with corrected data
 */
export async function DELETE() {
  try {
    const meiliClient = getMeiliClient();

    // Clear PostgreSQL albums table
    console.log("[Clear Albums] Deleting all albums from PostgreSQL...");
    const deletedCount = await albumRepository.deleteAllAlbums();
    console.log(
      `[Clear Albums] Deleted ${deletedCount} albums from PostgreSQL`
    );

    // Clear MeiliSearch albums index
    console.log("[Clear Albums] Deleting all documents from MeiliSearch...");
    try {
      const index = meiliClient.index("albums");
      await index.deleteAllDocuments();
      console.log("[Clear Albums] Cleared MeiliSearch albums index");
    } catch (meiliError) {
      console.warn("[Clear Albums] MeiliSearch clear warning:", meiliError);
      // Continue even if MeiliSearch fails
    }

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
