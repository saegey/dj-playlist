// Update a track by track_id, allowing partial updates (e.g. tags, metadata)
export async function updateTrack(data: { track_id: string; [key: string]: any }) {
  const { track_id, ...fields } = data;
  if (!track_id || Object.keys(fields).length === 0) return null;
  // Build dynamic SET clause
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const key in fields) {
    setClauses.push(`${key} = $${idx}`);
    values.push(fields[key]);
    idx++;
  }
  values.push(track_id);
  const query = `UPDATE tracks SET ${setClauses.join(", ")} WHERE track_id = $${idx} RETURNING *`;
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function getAllTracks() {
  const { rows } = await pool.query('SELECT * FROM tracks ORDER BY id DESC');
  return rows;
}


// Fetch all playlists with their track_ids as an array
export async function getAllPlaylists() {
  const playlistsRes = await pool.query('SELECT * FROM playlists ORDER BY id DESC');
  const playlists = playlistsRes.rows;
  if (playlists.length === 0) return [];
  const playlistIds = playlists.map((p: { id: number }) => p.id);
  const tracksRes = await pool.query(
    'SELECT playlist_id, track_id FROM playlist_tracks WHERE playlist_id = ANY($1)',
    [playlistIds]
  );
  const tracksByPlaylist: Record<number, string[]> = {};
  tracksRes.rows.forEach((row: { playlist_id: number; track_id: string }) => {
    if (!tracksByPlaylist[row.playlist_id]) tracksByPlaylist[row.playlist_id] = [];
    tracksByPlaylist[row.playlist_id].push(row.track_id);
  });
  return playlists.map((p: any) => ({ ...p, tracks: tracksByPlaylist[p.id] || [] }));
}


// Create a playlist and insert track associations
export async function createPlaylist(data: { name: string; tracks: string[] }) {
  const { name, tracks } = data;
  const playlistRes = await pool.query(
    'INSERT INTO playlists (name) VALUES ($1) RETURNING *',
    [name]
  );
  const playlist = playlistRes.rows[0];
  if (tracks && tracks.length > 0) {
    const values = tracks.map((trackId, i) => `($1, $${i + 2})`).join(',');
    await pool.query(
      `INSERT INTO playlist_tracks (playlist_id, track_id) VALUES ${values} ON CONFLICT DO NOTHING`,
      [playlist.id, ...tracks]
    );
  }
  return { ...playlist, tracks: tracks || [] };
}
