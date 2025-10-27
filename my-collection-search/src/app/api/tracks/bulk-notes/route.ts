import { NextResponse } from "next/server";
import { getTrackEmbedding } from "@/lib/track-embedding";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// POST: bulk update notes/genre
export async function POST(request: Request) {
  const { getMeiliClient } = await import("@/lib/meili");
  const meiliClient = getMeiliClient();

  try {
    const { updates } = await request.json();
    if (!Array.isArray(updates))
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const updatedTracks = [];
    for (const u of updates) {
      console.debug("Processing update:", u);
      if (!u.track_id) continue;
      // Fetch all current tracks for this track_id (all usernames)
      const { rows: currentRows } = await pool.query(
        `SELECT * FROM tracks WHERE track_id = $1`,
        [u.track_id]
      );
      // Update all rows for this track_id
      await pool.query(
        `UPDATE tracks SET local_tags = $1, notes = $2 WHERE track_id = $3`,
        [u.local_tags || "", u.notes || "", u.track_id]
      );
      // Fetch all updated tracks for MeiliSearch
      const { rows: updatedRows } = await pool.query(
        `SELECT * FROM tracks WHERE track_id = $1`,
        [u.track_id]
      );
      for (const updated of updatedRows) {
        // Only update embedding if local_tags or notes changed
        let shouldUpdateEmbedding = false;
        const current = currentRows.find(
          (r) => r.username === updated.username
        );
        for (const field of ["local_tags", "notes"]) {
          const before = current?.[field];
          const after = updated?.[field];
          if (before !== after) {
            shouldUpdateEmbedding = true;
            break;
          }
        }
        if (shouldUpdateEmbedding) {
          try {
            const embedding = await getTrackEmbedding(updated);
            const pgVector = `[${embedding.join(",")}]`;
            await pool.query(
              "UPDATE tracks SET embedding = $1 WHERE track_id = $2 AND username = $3",
              [pgVector, updated.track_id, updated.username]
            );
            updated.embedding = embedding;
          } catch (embedError) {
            console.error(
              "Failed to update embedding for track",
              updated.track_id,
              embedError
            );
          }
        }
        updatedTracks.push(updated);
      }
    }
    // Update MeiliSearch index
    if (updatedTracks.length > 0) {
      const index = meiliClient.index("tracks");
      await index.updateDocuments(updatedTracks);
    }
    return NextResponse.json({
      success: true,
      updated: updatedTracks.length,
      tracks: updatedTracks,
    });
  } catch (error) {
    console.error("Error in bulk notes update:", error);
    return NextResponse.json(
      { error: "Failed to update tracks" },
      { status: 500 }
    );
  }
}
