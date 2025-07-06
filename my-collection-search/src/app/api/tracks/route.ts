import { NextResponse } from 'next/server';
import { getAllTracks } from '@/lib/db';

export async function GET() {
  try {
    const tracks = await getAllTracks();
    return NextResponse.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
  }
}
