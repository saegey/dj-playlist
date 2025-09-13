import { Playlist } from "@/types/track";
import { NextResponse } from "next/server";

import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type PlaylistTrackRow = { playlist_id: number; track_id: string };

// Helper: fetch all playlists with their tracks
async function getAllPlaylistsWithTracks() {
  const playlistsRes = await pool.query(
    "SELECT * FROM playlists ORDER BY created_at DESC"
  );
  const playlists = playlistsRes.rows;
  if (playlists.length === 0) return [];
  const playlistIds = playlists.map((p: Playlist) => p.id);
  // Fetch tracks with position, order by position
  const tracksRes = await pool.query(
    "SELECT playlist_id, track_id FROM playlist_tracks WHERE playlist_id = ANY($1) ORDER BY position ASC",
    [playlistIds]
  );
  const tracksByPlaylist: Record<number, string[]> = {};

  tracksRes.rows.forEach((row: PlaylistTrackRow) => {
    if (!tracksByPlaylist[row.playlist_id])
      tracksByPlaylist[row.playlist_id] = [];
    tracksByPlaylist[row.playlist_id].push(row.track_id);
  });
  return playlists.map((p: Playlist) => ({
    ...p,
    tracks: tracksByPlaylist[p.id] || [],
  }));
}

// Helper: create playlist and insert tracks
async function createPlaylistWithTracks(data: {
  name: string;
  tracks: string[];
}) {
  const { name, tracks } = data;
  const playlistRes = await pool.query(
    "INSERT INTO playlists (name) VALUES ($1) RETURNING *",
    [name]
  );
  const playlist = playlistRes.rows[0];
  if (tracks && tracks.length > 0) {
    // Insert with position
    const values = tracks
      .map((trackId, i) => `($1, $${i + 2}, ${i})`)
      .join(",");
    const query = `INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ${values} ON CONFLICT DO NOTHING`;
    console.debug("Executing query:", query, [playlist.id, ...tracks]);
    await pool.query(query, [playlist.id, ...tracks]);
  }
  return { ...playlist, tracks: tracks || [] };
}

// Helper: delete playlist (playlist_tracks will cascade)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing playlist id" },
        { status: 400 }
      );
    }
    // Delete playlist (playlist_tracks will cascade)
    const result = await pool.query(
      "DELETE FROM playlists WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return NextResponse.json(
      { error: "Failed to delete playlist" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const playlists = await getAllPlaylistsWithTracks();
    return NextResponse.json(playlists);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const playlist = await createPlaylistWithTracks(data);
    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.error("Error creating playlist:", error);
    return NextResponse.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}

// Update a playlist's name and/or tracks
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const idRaw = body?.id;
    const name: string | undefined = body?.name;
    const tracks: string[] | undefined = body?.tracks;

    const id = Number(idRaw);
    if (!idRaw || Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid or missing playlist id" }, { status: 400 });
    }

    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json({ error: "'name' must be a string" }, { status: 400 });
    }
    if (tracks !== undefined && !Array.isArray(tracks)) {
      return NextResponse.json({ error: "'tracks' must be an array of track ids" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure playlist exists
      const existsRes = await client.query('SELECT id, name FROM playlists WHERE id = $1', [id]);
      if (existsRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
      }

      // Update name if provided
      if (name !== undefined) {
        await client.query('UPDATE playlists SET name = $1 WHERE id = $2', [name, id]);
      }

      // Update tracks if provided (replace positions)
      if (tracks !== undefined) {
        await client.query('DELETE FROM playlist_tracks WHERE playlist_id = $1', [id]);
        if (tracks.length > 0) {
          const values = tracks.map((_, i) => `($1, $${i + 2}, ${i})`).join(',');
          const insertSql = `INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ${values}`;
          await client.query(insertSql, [id, ...tracks]);
        }
      }

      await client.query('COMMIT');

      // Fetch updated playlist and tracks
      const playlistRes = await pool.query('SELECT * FROM playlists WHERE id = $1', [id]);
      const playlistRow = playlistRes.rows[0];
      const tracksRes = await pool.query(
        'SELECT track_id FROM playlist_tracks WHERE playlist_id = $1 ORDER BY position ASC',
        [id]
      );
      const trackIds = tracksRes.rows.map((r: { track_id: string }) => r.track_id);

      return NextResponse.json({ ...playlistRow, tracks: trackIds });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}
