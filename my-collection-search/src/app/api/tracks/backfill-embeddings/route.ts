import { NextResponse } from "next/server";

export const maxDuration = 300; // allow up to 5 minutes for this route

export async function POST() {
  const { getMeiliClient } = await import("@/lib/meili");
  const meiliClient = getMeiliClient();
  const { getTrackEmbedding } = await import("@/lib/track-embedding");
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Fetch all tracks
    const res = await pool.query("SELECT * FROM tracks WHERE username = 'saegey'");
    const tracks = res.rows;
    let updatedCount = 0;
    const failed = [];
    for (const track of tracks) {
      try {
        const embedding = await getTrackEmbedding(track);
        const pgVector = `[${embedding.join(",")}]`;
        await pool.query(
          "UPDATE tracks SET embedding = $1 WHERE track_id = $2",
          [pgVector, track.track_id]
        );
        // Update MeiliSearch
        const index = meiliClient.index("tracks");
        await index.updateDocuments([
          {
            ...track,
            _vectors: { default: embedding },
          },
        ]);
        updatedCount++;
      } catch (err) {
        console.error("Failed to backfill embedding for track", track.track_id, err);
        failed.push(track.track_id);
      }
    }
    return NextResponse.json({ updated: updatedCount, failed });
  } catch (error) {
    console.error("Error backfilling embeddings:", error);
    return NextResponse.json({ error: "Failed to backfill embeddings" }, { status: 500 });
  }
}
