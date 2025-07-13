import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    // Find tracks with apple_music_url or youtube_url, but no local_audio_url
    let where = "(local_audio_url IS NULL OR local_audio_url = '') AND (apple_music_url IS NOT NULL OR youtube_url IS NOT NULL)";
    let params: (string | number)[] = [];
    if (username) {
      where += " AND username = $1";
      params = [username];
    }
    const query = `SELECT * FROM tracks WHERE ${where} ORDER BY id DESC LIMIT 200`;
    const { rows } = await pool.query(query, params);
    return NextResponse.json({ tracks: rows });
  } catch (error) {
    console.error('Error fetching tracks for backfill:', error);
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
  }
}
