import { Playlist } from "@/types/track";
import { Pool } from "pg";
import { start } from "repl";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
type UpdateTrackInput = {
  track_id: string;
  username: string;
  title?: string | null;
  artist?: string | null;
  album?: string | null;
  local_tags?: string | null;
  apple_music_url?: string | null;
  local_audio_url?: string | null;
  youtube_url?: string | null;
  soundcloud_url?: string | null;
  spotify_url?: string | null;
  duration_seconds?: number | null;
  notes: string | null;
  bpm: number | null;
  key: string | null;
  danceability: number | null;
  star_rating: number | null;
};

const UPDATABLE_COLUMNS = {
  title: "title",
  artist: "artist",
  album: "album",
  local_tags: "local_tags",
  apple_music_url: "apple_music_url",
  youtube_url: "youtube_url",
  soundcloud_url: "soundcloud_url",
  spotify_url: "spotify_url",
  local_audio_url: "local_audio_url",
  duration_seconds: "duration_seconds",
  notes: 'notes',
  bpm: "bpm",
  key: "key",
  danceability: "danceability",
  star_rating: "star_rating",
} as const;

export async function updateTrack(data: UpdateTrackInput) {
  const { track_id, username, ...fields } = data;
  if (!track_id || !username) return null;

  // Keep everything except `undefined`. Allow null and "" to pass through.
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);

  // Nothing to update? Return current row.
  if (entries.length === 0) {
    const currentRes = await pool.query(
      "SELECT * FROM tracks WHERE track_id = $1 AND username = $2",
      [track_id, username]
    );
    return currentRes.rows[0] ?? null;
  }

  // Build dynamic SET ... with safe whitelist + correct casts
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, value] of entries) {
    if (!(key in UPDATABLE_COLUMNS)) continue; // ignore unknown keys
    const col = UPDATABLE_COLUMNS[key as keyof typeof UPDATABLE_COLUMNS];

    // Cast arrays explicitly so null/empty work predictably
    if (col === "duration_seconds" || col === "bpm") {
      setClauses.push(`${col} = $${idx}::integer`);
    } else {
      setClauses.push(`${col} = $${idx}`);
    }
    values.push(value);
    idx++;
  }

  // Optionally update a timestamp
  // setClauses.push(`updated_at = NOW()`);

  // WHERE params
  values.push(track_id, username);

  // If after whitelisting there’s still nothing to set, just return current.
  if (setClauses.length === 0) {
    const currentRes = await pool.query(
      "SELECT * FROM tracks WHERE track_id = $1 AND username = $2",
      [track_id, username]
    );
    return currentRes.rows[0] ?? null;
  }

  const sql = `
    UPDATE tracks
    SET ${setClauses.join(", ")}
    WHERE track_id = $${idx} AND username = $${idx + 1}
    RETURNING *;
  `;

  const { rows } = await pool.query(sql, values);
  return rows[0] ?? null;
}

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
