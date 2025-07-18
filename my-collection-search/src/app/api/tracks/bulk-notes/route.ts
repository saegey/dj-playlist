import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET: tracks missing notes or local_tags
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    let where =
      "(notes IS NULL OR notes = '' OR local_tags IS NULL OR local_tags = '')";
    let params: (string | number)[] = [];
    if (username) {
      where += " AND username = $1";
      params = [username];
    }
    const query = `SELECT * FROM tracks WHERE ${where} ORDER BY id DESC LIMIT 200`;
    const { rows } = await pool.query(query, params);
    return NextResponse.json({ tracks: rows });
  } catch (error) {
    console.error("Error fetching tracks for bulk notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 }
    );
  }
}

// POST: bulk update notes/genre
export async function POST(request: Request) {
  const { getMeiliClient } = await import("@/lib/meili");
  const meiliClient = getMeiliClient({ server: true });

  try {
    const { updates } = await request.json();
    if (!Array.isArray(updates))
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const updatedTracks = [];
    for (const u of updates) {
      console.debug("Processing update:", u);
      if (!u.track_id) continue;
      // Update DB
      await pool.query(
        `UPDATE tracks SET local_tags = $1, notes = $2 WHERE track_id = $3`,
        [u.local_tags || "", u.notes || "", u.track_id]
      );
      // Fetch updated track for MeiliSearch
      const { rows } = await pool.query(
        `SELECT * FROM tracks WHERE track_id = $1`,
        [u.track_id]
      );
      if (rows[0]) updatedTracks.push(rows[0]);
    }
    // Update MeiliSearch index
    if (updatedTracks.length > 0) {
      const index = meiliClient.index("tracks");
      await index.updateDocuments(updatedTracks);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in bulk notes update:", error);
    return NextResponse.json(
      { error: "Failed to update tracks" },
      { status: 500 }
    );
  }
}
