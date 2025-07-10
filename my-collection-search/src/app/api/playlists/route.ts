import { NextResponse } from 'next/server';

import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper: fetch all playlists with their tracks
async function getAllPlaylistsWithTracks() {
  const playlistsRes = await pool.query('SELECT * FROM playlists ORDER BY created_at DESC');
  const playlists = playlistsRes.rows;
  if (playlists.length === 0) return [];
  const playlistIds = playlists.map((p: any) => p.id);
  // Fetch tracks with position, order by position
  const tracksRes = await pool.query(
    'SELECT playlist_id, track_id FROM playlist_tracks WHERE playlist_id = ANY($1) ORDER BY position ASC',
    [playlistIds]
  );
  const tracksByPlaylist: Record<number, string[]> = {};
  tracksRes.rows.forEach((row: any) => {
    if (!tracksByPlaylist[row.playlist_id]) tracksByPlaylist[row.playlist_id] = [];
    tracksByPlaylist[row.playlist_id].push(row.track_id);
  });
  return playlists.map((p: any) => ({ ...p, tracks: tracksByPlaylist[p.id] || [] }));
}

// Helper: create playlist and insert tracks
async function createPlaylistWithTracks(data: { name: string; tracks: string[] }) {
  const { name, tracks } = data;
  const playlistRes = await pool.query(
    'INSERT INTO playlists (name) VALUES ($1) RETURNING *',
    [name]
  );
  const playlist = playlistRes.rows[0];
  if (tracks && tracks.length > 0) {
    // Insert with position
    const values = tracks.map((trackId, i) => `($1, $${i + 2}, ${i})`).join(',');
    const query = `INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ${values} ON CONFLICT DO NOTHING`;
    console.debug('Executing query:', query, [playlist.id, ...tracks]);
    await pool.query(
      query,
      [playlist.id, ...tracks]
    );
  }
  return { ...playlist, tracks: tracks || [] };
}

// Helper: delete playlist (playlist_tracks will cascade)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing playlist id' }, { status: 400 });
    }
    // Delete playlist (playlist_tracks will cascade)
    const result = await pool.query('DELETE FROM playlists WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const playlists = await getAllPlaylistsWithTracks();
    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const playlist = await createPlaylistWithTracks(data);
    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
