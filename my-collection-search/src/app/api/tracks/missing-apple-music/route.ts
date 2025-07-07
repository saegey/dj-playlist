import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: Request) {
  try {
    // Parse pagination params from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const offset = (page - 1) * pageSize;

    // Get total count for pagination
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM tracks WHERE apple_music_url IS NULL OR apple_music_url = ''"
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const { rows } = await pool.query(
      "SELECT * FROM tracks WHERE apple_music_url IS NULL OR apple_music_url = '' ORDER BY id DESC LIMIT $1 OFFSET $2",
      [pageSize, offset]
    );

    return NextResponse.json({
      tracks: rows,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching tracks missing Apple Music URL:', error);
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
  }
}
