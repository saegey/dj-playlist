import { Pool } from "pg";
import { getTrackEmbedding } from "@/lib/track-embedding";
import { Track } from "@/types/track";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});


async function getTrack(track_id: string): Promise<Track | null> {
  const res = await pool.query("SELECT * FROM tracks WHERE track_id = $1", [
    track_id,
  ]);
  return res.rows[0] || null;
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { track_id } = body;
    if (!track_id) {
      return new Response(JSON.stringify({ error: "Missing track_id" }), {
        status: 400,
      });
    }
    const track = await getTrack(track_id);
    if (!track) {
      return new Response(JSON.stringify({ error: "Track not found" }), {
        status: 404,
      });
    }

    const embedding = await getTrackEmbedding(track);
    // Convert JS array to Postgres vector format: [0.1,0.2,...]
    const pgVector = `[${embedding.join(",")}]`;
    await pool.query("UPDATE tracks SET embedding = $1 WHERE track_id = $2", [
      pgVector,
      track_id,
    ]);

    // Update MeiliSearch index with new embedding
    try {
      const { getMeiliClient } = await import("@/lib/meili");
      const meiliClient = getMeiliClient({ server: true });
      const index = meiliClient.index("tracks");
      await index.updateDocuments([
        {
          track_id,
          _vectors: { default: embedding }, // Use default vector field
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
