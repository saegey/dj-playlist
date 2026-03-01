import { NextResponse } from "next/server";
import { trackRepository } from "@/server/repositories/trackRepository";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      tracks: Array<{ track_id: string; friend_id: number; position?: number }>;
    };
    const tracks = Array.isArray(body?.tracks) ? body.tracks : [];
    if (tracks.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Build a VALUES table of (track_id, friend_id, ord) to preserve order
    const rows = await trackRepository.findTracksByRefsPreservingOrder(tracks);

    // Normalize embedding into _vectors.default
    const ordered = rows.map((t) => {
      let embeddingArr: number[] | null = null;
      if (t.embedding) {
        if (Array.isArray(t.embedding)) embeddingArr = t.embedding as number[];
        else if (typeof t.embedding === "string") {
          try {
            embeddingArr = JSON.parse(t.embedding) as number[];
          } catch {
            embeddingArr = null;
          }
        }
      }
      return {
        ...t,
        _vectors: embeddingArr ? { default: embeddingArr } : undefined,
      };
    });
    return NextResponse.json(ordered);
  } catch (error) {
    console.error("Error fetching tracks by ids:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 }
    );
  }
}
