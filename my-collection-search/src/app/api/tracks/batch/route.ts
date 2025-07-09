import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: Request) {
  try {
    const { track_ids } = await req.json();
    if (!Array.isArray(track_ids) || track_ids.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    // Build parameterized query for track_ids
    const params = track_ids.map((_, i) => `$${i + 1}`).join(',');
    const query = `SELECT * FROM tracks WHERE track_id IN (${params})`;
    const { rows } = await pool.query(query, track_ids);
    // Preserve order of input track_ids
    const trackMap = Object.fromEntries(rows.map((t) => [t.track_id, t]));
    const ordered = track_ids.map((id) => trackMap[id]).filter(Boolean);
    return NextResponse.json(ordered);
  } catch (error) {
    console.error('Error fetching tracks by ids:', error);
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
  }
}
