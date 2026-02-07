import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
    const values: string[] = [];
  const params: (string | number)[] = [];
    let p = 1;
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      values.push(`($${p++}::text,$${p++}::int,$${p++}::int)`);
      params.push(t.track_id, t.friend_id, i);
    }
    const query = `
      SELECT t.*, a.library_identifier, v.ord
      FROM (VALUES ${values.join(",")}) AS v(track_id, friend_id, ord)
      JOIN tracks t
        ON t.track_id = v.track_id AND t.friend_id = v.friend_id
      LEFT JOIN albums a
        ON t.release_id = a.release_id AND t.friend_id = a.friend_id
      ORDER BY v.ord
    `;
    const { rows } = await pool.query(query, params);

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
