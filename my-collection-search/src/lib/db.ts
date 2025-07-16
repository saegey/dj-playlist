// Get the number of playlists each track appears in
// Returns: { [track_id: string]: number }
export async function getPlaylistCountsForTracks(
  trackIds: string[]
): Promise<Record<string, number>> {
  if (!trackIds || trackIds.length === 0) return {};
  const { rows } = await pool.query(
    `SELECT track_id, COUNT(DISTINCT playlist_id) as count
     FROM playlist_tracks
     WHERE track_id = ANY($1)
     GROUP BY track_id`,
    [trackIds]
  );
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.track_id] = Number(row.count);
  }
  // Ensure all requested trackIds are present (default 0)
  for (const id of trackIds) {
    if (!(id in result)) result[id] = 0;
  }
  return result;
}
// Update a track by track_id, allowing partial updates (e.g. tags, metadata)
export async function updateTrack(data: {
  track_id: string;
  title?: string;
  artist?: string;
  album?: string;
  local_tags?: string[];
  apple_music_url?: string;
  local_audio_url?: string;
}) {
  const { track_id, ...fields } = data;
  if (!track_id || Object.keys(fields).length === 0) return null;
  // Fetch current track to preserve local_audio_url
  const currentRes = await pool.query(
    "SELECT local_audio_url FROM tracks WHERE track_id = $1",
    [track_id]
  );
  const current = currentRes.rows[0];
  // if (current && current.local_audio_url !== undefined) {
  //   // Remove local_audio_url from update fields if present
  //   if ("local_audio_url" in fields) {
  //     delete fields.local_audio_url;
  //   }
  // }
  // Build dynamic SET clause
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const key in fields) {
    setClauses.push(`${key} = $${idx}`);
    values.push(fields[key as keyof typeof fields]);
    idx++;
  }
  values.push(track_id);
  if (setClauses.length === 0) return current || null;
  const query = `UPDATE tracks SET ${setClauses.join(
    ", "
  )} WHERE track_id = $${idx} RETURNING *`;
  const { rows } = await pool.query(query, values);
  return rows[0] || current || null;
}
import { Playlist } from "@/types/track";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function getAllTracks() {
  const { rows } = await pool.query("SELECT * FROM tracks ORDER BY id DESC");
  return rows;
}

// Fetch all playlists with their track_ids as an array
export async function getAllPlaylists() {
  const playlistsRes = await pool.query(
    "SELECT * FROM playlists ORDER BY id DESC"
  );
  const playlists = playlistsRes.rows;
  if (playlists.length === 0) return [];
  const playlistIds = playlists.map((p: { id: number }) => p.id);
  const tracksRes = await pool.query(
    "SELECT playlist_id, track_id FROM playlist_tracks WHERE playlist_id = ANY($1)",
    [playlistIds]
  );
  const tracksByPlaylist: Record<number, string[]> = {};
  tracksRes.rows.forEach((row: { playlist_id: number; track_id: string }) => {
    if (!tracksByPlaylist[row.playlist_id])
      tracksByPlaylist[row.playlist_id] = [];
    tracksByPlaylist[row.playlist_id].push(row.track_id);
  });
  
  return playlists.map((p: Playlist) => ({
    ...p,
    tracks: tracksByPlaylist[p.id] || [],
  }));
}

// Create a playlist and insert track associations
export async function createPlaylist(data: { name: string; tracks: string[] }) {
  const { name, tracks } = data;
  const playlistRes = await pool.query(
    "INSERT INTO playlists (name) VALUES ($1) RETURNING *",
    [name]
  );
  const playlist = playlistRes.rows[0];
  if (tracks && tracks.length > 0) {
    const values = tracks.map((trackId, i) => `($1, $${i + 2})`).join(",");
    await pool.query(
      `INSERT INTO playlist_tracks (playlist_id, track_id) VALUES ${values} ON CONFLICT DO NOTHING`,
      [playlist.id, ...tracks]
    );
  }
  return { ...playlist, tracks: tracks || [] };
}
