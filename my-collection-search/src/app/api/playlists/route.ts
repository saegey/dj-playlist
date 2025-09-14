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

// Types for playlist track input
interface PlaylistTrackInput {
  track_id: string;
  friend_id?: number;
  position?: number;
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
    // Resolve friend_id for each track
    const resolvedTracks = await Promise.all(
      tracks.map(async (track, i) => {
        let friendId: number | undefined;

        if (typeof track === "object" && track.friend_id) {
          friendId = track.friend_id;
        } else {
          // fallback: resolve friendId if not provided
          friendId = await resolveFriendIdForTrack(track.track_id);
        }

        return {
          track_id: track.track_id,
          friend_id: friendId,
          position: i,
        };
      })
    );

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
                friendId = await resolveFriendIdForTrack(trackId);
              }

              return {
                track_id: trackId,
                friend_id: friendId,
                position: i,
              };
            })
          );

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
