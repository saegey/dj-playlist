import { getTrackEmbedding } from "@/lib/track-embedding";
import { trackRepository } from "@/server/repositories/trackRepository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { track_id, friend_id } = body;
    if (!track_id) {
      return new Response(JSON.stringify({ error: "Missing track_id" }), {
        status: 400,
      });
    }
    if (!friend_id) {
      return new Response(JSON.stringify({ error: "Missing friend_id" }), {
        status: 400,
      });
    }
    const track = await trackRepository.findTrackByTrackIdAndFriendIdRaw(
      track_id,
      friend_id
    );
    if (!track) {
      return new Response(JSON.stringify({ error: "Track not found" }), {
        status: 404,
      });
    }

    const embedding = await getTrackEmbedding(track);
    await trackRepository.updateTrackEmbedding(track_id, friend_id, embedding);

    // Update MeiliSearch index with new embedding
    try {
      const { getMeiliClient } = await import("@/lib/meili");
      const meiliClient = getMeiliClient();
      const index = meiliClient.index("tracks");
      await index.updateDocuments([
        {
          ...track,
          hasVectors: true,
          _vectors: { default: embedding },
        },
      ]);
    } catch (err) {
      console.warn("Failed to update MeiliSearch embedding:", err);
    }

    return new Response(JSON.stringify({ embedding }), { status: 200 });
  } catch (err) {
    console.error("Vectorize error:", err);
    const errorMessage =
      typeof err === "object" && err !== null && "message" in err
        ? (err as { message?: string }).message
        : "Internal error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}
