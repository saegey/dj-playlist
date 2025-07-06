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

export async function getAllPlaylists() {
  const { rows } = await pool.query('SELECT * FROM playlists ORDER BY id DESC');
  return rows;
}

export async function createPlaylist(data: { name: string; tracks: any[] }) {
  const { name, tracks } = data;
  const { rows } = await pool.query(
    'INSERT INTO playlists (name, tracks) VALUES ($1, $2) RETURNING *',
    [name, JSON.stringify(tracks)]
  );
  return rows[0];
}
