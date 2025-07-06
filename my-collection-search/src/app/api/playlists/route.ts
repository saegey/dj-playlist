import { NextResponse } from 'next/server';
import { getAllPlaylists, createPlaylist } from '@/lib/db';

export async function GET() {
  try {
    const playlists = await getAllPlaylists();
    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const playlist = await createPlaylist(data);
    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
