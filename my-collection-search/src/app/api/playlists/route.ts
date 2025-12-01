import { Playlist } from "@/types/track";
import { NextResponse } from "next/server";

import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type PlaylistTrackRow = {
  playlist_id: number;
  track_id: string;
  friend_id: number;
};

// Helper functions for friend_id resolution
async function getDefaultFriendId(): Promise<number> {
  const result = await pool.query("SELECT id FROM friends ORDER BY id LIMIT 1");
  if (result.rows.length === 0) {
    throw new Error("No friends found");
  }
  return result.rows[0].id;
}

async function resolveFriendIdForTrack(
  trackId: string,
  username?: string
): Promise<number> {
  if (username) {
    const result = await pool.query(
      "SELECT id FROM friends WHERE username = $1",
      [username]
    );
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
  }

  // Fallback: find any friend who has this track
  const result = await pool.query(
    "SELECT friend_id FROM tracks WHERE track_id = $1 LIMIT 1",
    [trackId]
  );
  if (result.rows.length > 0) {
    return result.rows[0].friend_id;
  }

  return await getDefaultFriendId();
}

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
    "SELECT playlist_id, track_id, friend_id FROM playlist_tracks WHERE playlist_id = ANY($1) ORDER BY position ASC",
    [playlistIds]
  );
  const tracksByPlaylist: Record<number, PlaylistTrackRow[]> = {};

  tracksRes.rows.forEach((row: PlaylistTrackRow) => {
    if (!tracksByPlaylist[row.playlist_id])
      tracksByPlaylist[row.playlist_id] = [];
    tracksByPlaylist[row.playlist_id].push(row);
  });
  return playlists.map((p: Playlist) => ({
    ...p,
    tracks: tracksByPlaylist[p.id] || [],
  }));
}

// Types for playlist track input (allows metadata passthrough)
interface PlaylistTrackInput {
  track_id: string;
  friend_id?: number;
  username?: string | null;
  title?: string | null;
  artist?: string | null;
  album?: string | null;
  year?: string | number | null;
  styles?: string[] | null;
  genres?: string[] | null;
  duration?: string | null;
  duration_seconds?: number | null;
  position?: number | null;
  discogs_url?: string | null;
  apple_music_url?: string | null;
  youtube_url?: string | null;
  spotify_url?: string | null;
  soundcloud_url?: string | null;
  album_thumbnail?: string | null;
  local_tags?: string | null;
  bpm?: number | string | null;
  key?: string | null;
  danceability?: number | null;
  notes?: string | null;
  star_rating?: number | null;
  release_id?: string | null;
  mood_happy?: number | null;
  mood_sad?: number | null;
  mood_relaxed?: number | null;
  mood_aggressive?: number | null;
  local_audio_url?: string | null;
}

function normalizeStringArray(arr?: unknown): string[] | null {
  if (!arr) return null;
  if (Array.isArray(arr)) return arr.map(String);
  return null;
}

async function upsertTracksWithMetadata(
  tracks: PlaylistTrackInput[]
): Promise<void> {
  if (!tracks || tracks.length === 0) return;

  const columns = [
    "title",
    "artist",
    "album",
    "year",
    "styles",
    "genres",
    "duration",
    "discogs_url",
    "apple_music_url",
    "youtube_url",
    "spotify_url",
    "soundcloud_url",
    "album_thumbnail",
    "local_tags",
    "bpm",
    "key",
    "danceability",
    "duration_seconds",
    "notes",
    "local_audio_url",
    "star_rating",
    "release_id",
    "mood_happy",
    "mood_sad",
    "mood_relaxed",
    "mood_aggressive",
    "username",
  ] as const;

  for (const rawTrack of tracks) {
    if (!rawTrack.track_id || !rawTrack.friend_id) continue;
    const title =
      typeof rawTrack.title === "string" && rawTrack.title.trim().length > 0
        ? rawTrack.title.trim()
        : null;
    const artist =
      typeof rawTrack.artist === "string" && rawTrack.artist.trim().length > 0
        ? rawTrack.artist.trim()
        : null;

    const bpmNumber =
      typeof rawTrack.bpm === "number"
        ? rawTrack.bpm
        : typeof rawTrack.bpm === "string"
        ? Number(rawTrack.bpm)
        : null;
    const durationSecondsNumber =
      typeof rawTrack.duration_seconds === "number"
        ? rawTrack.duration_seconds
        : typeof rawTrack.duration_seconds === "string"
        ? Number(rawTrack.duration_seconds)
        : null;
    const starRatingNumber =
      typeof rawTrack.star_rating === "number"
        ? rawTrack.star_rating
        : typeof rawTrack.star_rating === "string"
        ? Number(rawTrack.star_rating)
        : null;

    const updateValues: Record<(typeof columns)[number], unknown> = {
      title,
      artist,
      album: rawTrack.album ?? null,
      year:
        typeof rawTrack.year === "number" || typeof rawTrack.year === "string"
          ? rawTrack.year
          : null,
      styles: normalizeStringArray(rawTrack.styles),
      genres: normalizeStringArray(rawTrack.genres),
      duration: rawTrack.duration ?? null,
      discogs_url: rawTrack.discogs_url ?? null,
      apple_music_url: rawTrack.apple_music_url ?? null,
      youtube_url: rawTrack.youtube_url ?? null,
      spotify_url: rawTrack.spotify_url ?? null,
      soundcloud_url: rawTrack.soundcloud_url ?? null,
      album_thumbnail: rawTrack.album_thumbnail ?? null,
      local_tags: rawTrack.local_tags ?? null,
      bpm: Number.isFinite(bpmNumber) ? bpmNumber : null,
      key: rawTrack.key ?? null,
      danceability: rawTrack.danceability ?? null,
      duration_seconds: Number.isFinite(durationSecondsNumber)
        ? durationSecondsNumber
        : null,
      notes: rawTrack.notes ?? null,
      local_audio_url: rawTrack.local_audio_url ?? null,
      star_rating: Number.isFinite(starRatingNumber) ? starRatingNumber : null,
      release_id: rawTrack.release_id ?? null,
      mood_happy: rawTrack.mood_happy ?? null,
      mood_sad: rawTrack.mood_sad ?? null,
      mood_relaxed: rawTrack.mood_relaxed ?? null,
      mood_aggressive: rawTrack.mood_aggressive ?? null,
      username: rawTrack.username ?? null,
    };

    // Try update first to avoid relying on a specific unique constraint
    const updateParams: unknown[] = [];
    const setClauses: string[] = [];
    let idx = 1;
    for (const col of columns) {
      setClauses.push(`${col} = COALESCE($${idx}, ${col})`);
      updateParams.push(updateValues[col]);
      idx += 1;
    }
    // WHERE params
    updateParams.push(rawTrack.track_id, rawTrack.friend_id);

    const updateSql = `
      UPDATE tracks
      SET ${setClauses.join(", ")}
      WHERE track_id = $${idx} AND friend_id = $${idx + 1}
      RETURNING track_id;
    `;

    const updateRes = await pool.query(updateSql, updateParams);
    if (updateRes.rowCount > 0) {
      continue; // updated existing row
    }

    // Insert if no existing row
    const insertTitle = title ?? rawTrack.track_id;
    const insertArtist = artist ?? "Unknown Artist";
    const insertValues = {
      ...updateValues,
      title: insertTitle,
      artist: insertArtist,
    };
    const insertColumns = ["track_id", "friend_id", ...columns] as const;
    const insertParams: unknown[] = [
      rawTrack.track_id,
      rawTrack.friend_id,
      ...columns.map((col) => insertValues[col]),
    ];
    const placeholders = insertColumns.map((_, i) => `$${i + 1}`).join(", ");
    const insertSql = `
      INSERT INTO tracks (${insertColumns.join(", ")})
      SELECT ${placeholders}
      WHERE NOT EXISTS (
        SELECT 1 FROM tracks WHERE track_id = $1 AND friend_id = $2
      );
    `;

    await pool.query(insertSql, insertParams);
  }
}

// Helper: create playlist and insert tracks
async function createPlaylistWithTracks(data: {
  name: string;
  tracks: PlaylistTrackInput[];
}) {
  const { name, tracks } = data;
  const playlistRes = await pool.query(
    "INSERT INTO playlists (name) VALUES ($1) RETURNING *",
    [name]
  );
  const playlist = playlistRes.rows[0];

  if (tracks && tracks.length > 0) {
    // Resolve friend_id for each track (preserve metadata)
    const resolvedTracks = await Promise.all(
      tracks.map(async (track, i) => {
        let friendId: number | undefined;

        if (typeof track === "object" && track.friend_id) {
          friendId = track.friend_id;
        } else {
          // fallback: resolve friendId if not provided
          friendId = await resolveFriendIdForTrack(track.track_id, track.username ?? undefined);
        }

        return {
          ...track,
          friend_id: friendId,
          position: i,
        };
      })
    );

    await upsertTracksWithMetadata(resolvedTracks);

    // Insert with position and friend_id
    const values = resolvedTracks
      .map((_, i) => `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`)
      .join(",");
    const query = `INSERT INTO playlist_tracks (playlist_id, track_id, friend_id, position) VALUES ${values} ON CONFLICT DO NOTHING`;

    const params = [playlist.id];
    resolvedTracks.forEach((track) => {
      params.push(track.track_id, track.friend_id, track.position);
    });

    console.debug("Executing query:", query, params);
    await pool.query(query, params);
  }

  return {
    ...playlist,
    tracks:
      tracks.map((t) => ({
        track_id: t.track_id,
        friend_id: t.friend_id,
        position: t.position,
      })) || [],
  };
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
    const tracks: (string | PlaylistTrackInput)[] | undefined = body?.tracks;
    const default_friend_id: number | undefined = body?.default_friend_id;

    const id = Number(idRaw);
    if (!idRaw || Number.isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid or missing playlist id" },
        { status: 400 }
      );
    }

    if (name !== undefined && typeof name !== "string") {
      return NextResponse.json(
        { error: "'name' must be a string" },
        { status: 400 }
      );
    }
    if (tracks !== undefined && !Array.isArray(tracks)) {
      return NextResponse.json(
        { error: "'tracks' must be an array of track ids or objects" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Ensure playlist exists
      const existsRes = await client.query(
        "SELECT id, name FROM playlists WHERE id = $1",
        [id]
      );
      if (existsRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Playlist not found" },
          { status: 404 }
        );
      }

      // Update name if provided
      if (name !== undefined) {
        await client.query("UPDATE playlists SET name = $1 WHERE id = $2", [
          name,
          id,
        ]);
      }

      // Update tracks if provided (replace positions)
      if (tracks !== undefined) {
        await client.query(
          "DELETE FROM playlist_tracks WHERE playlist_id = $1",
          [id]
        );
        if (tracks.length > 0) {
          // Resolve friend_id for each track
          const resolvedTracks = await Promise.all(
            tracks.map(async (track, i) => {
              const trackId =
                typeof track === "string" ? track : track.track_id;
              let friendId: number;

              if (typeof track === "object" && track.friend_id) {
                friendId = track.friend_id;
              } else if (default_friend_id) {
                friendId = default_friend_id;
              } else {
                // Resolve friend_id from existing track data
                friendId = await resolveFriendIdForTrack(
                  trackId,
                  typeof track === "object" ? track.username ?? undefined : undefined
                );
              }

              return {
                ...(typeof track === "object" ? track : { track_id: trackId }),
                track_id: trackId,
                friend_id: friendId,
                position: i,
              };
            })
          );

          await upsertTracksWithMetadata(resolvedTracks);

          // Insert with position and friend_id
          const values = resolvedTracks
            .map((_, i) => `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`)
            .join(",");
          const insertSql = `INSERT INTO playlist_tracks (playlist_id, track_id, friend_id, position) VALUES ${values}`;

          const params: (string | number)[] = [id];
          resolvedTracks.forEach((track) => {
            params.push(track.track_id, track.friend_id, track.position);
          });

          await client.query(insertSql, params);
        }
      }

      await client.query("COMMIT");

      // Fetch updated playlist and tracks
      const playlistRes = await pool.query(
        "SELECT * FROM playlists WHERE id = $1",
        [id]
      );
      const playlistRow = playlistRes.rows[0];
      const tracksRes = await pool.query(
        "SELECT track_id, friend_id FROM playlist_tracks WHERE playlist_id = $1 ORDER BY position ASC",
        [id]
      );
      const trackIds = tracksRes.rows.map(
        (r: { track_id: string; friend_id: number }) => ({
          track_id: r.track_id,
          friend_id: r.friend_id,
        })
      );

      return NextResponse.json({ ...playlistRow, tracks: trackIds });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating playlist:", error);
    return NextResponse.json(
      { error: "Failed to update playlist" },
      { status: 500 }
    );
  }
}
