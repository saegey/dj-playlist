import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getMeiliClient } from "@/lib/meili";

/**
 * DELETE endpoint to clear all albums from both PostgreSQL and MeiliSearch
 * Use this before re-backfilling with corrected data
 */
export async function DELETE() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const meiliClient = getMeiliClient();

    // Clear PostgreSQL albums table
    console.log("[Clear Albums] Deleting all albums from PostgreSQL...");
    const result = await pool.query("DELETE FROM albums");
    const deletedCount = result.rowCount || 0;
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

    await pool.end();

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
