import { NextResponse } from "next/server";
import { updateTrack } from "@/lib/db";
import { getTrackEmbedding } from "@/lib/track-embedding";

export async function PATCH(req: Request) {
  const { getMeiliClient } = await import("@/lib/meili");
  const meiliClient = getMeiliClient({ server: true });

  try {
    const data = await req.json();
    // Fetch the current track before update for comparison
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const currentRes = await pool.query(
      "SELECT * FROM tracks WHERE track_id = $1",
      [data.track_id]
    );
    const current = currentRes.rows[0];

    const updated = await updateTrack(data);
    if (!updated) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Only update embedding if any prompt field changed
    const promptFields = [
      "local_tags",
      "styles",
      "genres",
      "bpm",
      "key",
      "danceability",
      "mood_happy",
      "notes",
    ];
    let shouldUpdateEmbedding = false;
    for (const field of promptFields) {
      const before = current?.[field];
      const after = updated?.[field];
      // For arrays, compare as strings
      if (Array.isArray(before) || Array.isArray(after)) {
        if ((before || []).join() !== (after || []).join()) {
          shouldUpdateEmbedding = true;
          break;
        }
      } else if (before !== after) {
        shouldUpdateEmbedding = true;
        break;
      }
    }

    if (shouldUpdateEmbedding) {
      try {
        const embedding = await getTrackEmbedding(updated);
        const pgVector = `[${embedding.join(",")}]`;
        await pool.query(
          "UPDATE tracks SET embedding = $1 WHERE track_id = $2",
          [pgVector, updated.track_id]
        );
        updated.embedding = embedding;
        // Update MeiliSearch index with new embedding
        const index = meiliClient.index("tracks");
        await index.updateDocuments([
          {
            ...updated,
            _vectors: { default: embedding },
          },
        ]);
      } catch (embedError) {
        console.error("Failed to update embedding:", embedError);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating track:", error);
    return NextResponse.json(
      { error: "Failed to update track" },
      { status: 500 }
    );
  }
}
