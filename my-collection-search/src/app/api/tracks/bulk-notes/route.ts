import { NextResponse } from "next/server";
import { getTrackEmbedding } from "@/lib/track-embedding";
import { trackRepository } from "@/server/repositories/trackRepository";

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
      const currentRows = await trackRepository.findTracksByTrackId(u.track_id);
      // Update all rows for this track_id
      await trackRepository.updateTrackNotesAndTagsByTrackId(
        u.track_id,
        u.local_tags || "",
        u.notes || ""
      );
      // Fetch all updated tracks for MeiliSearch
      const updatedRows = await trackRepository.findTracksByTrackId(u.track_id);
      for (const updated of updatedRows) {
        // Only update embedding if local_tags or notes changed
        let shouldUpdateEmbedding = false;
        const current = currentRows.find(
          (r) => r.username === updated.username
        );
        for (const field of ["local_tags", "notes"] as const) {
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
            if (!updated.username) {
              throw new Error("Missing username for embedding update");
            }
            await trackRepository.updateTrackEmbeddingByTrackIdAndUsername(
              updated.track_id,
              updated.username,
              embedding
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
