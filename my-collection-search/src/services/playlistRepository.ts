import type { PoolClient } from "pg";
import type { Playlist } from "@/types/track";
import { dbPool, dbQuery } from "@/lib/serverDb";

export type Queryable = Pick<PoolClient, "query">;

export type PlaylistTrackRow = {
  playlist_id: number;
  track_id: string;
  friend_id: number;
  position: number;
};

export class PlaylistRepository {
  async getDefaultFriendId(): Promise<number> {
    const result = await dbQuery("SELECT id FROM friends ORDER BY id LIMIT 1");
    if (result.rows.length === 0) {
      throw new Error("No friends found");
    }
    return result.rows[0].id;
  }

  async findFriendIdByUsername(username: string): Promise<number | null> {
    const result = await dbQuery("SELECT id FROM friends WHERE username = $1", [
      username,
    ]);
    return result.rows[0]?.id ?? null;
  }

  async findAnyFriendIdForTrack(trackId: string): Promise<number | null> {
    const result = await dbQuery(
      "SELECT friend_id FROM tracks WHERE track_id = $1 LIMIT 1",
      [trackId]
    );
    return result.rows[0]?.friend_id ?? null;
  }

  async findFriendUsernameById(friendId: number): Promise<string | null> {
    const result = await dbQuery("SELECT username FROM friends WHERE id = $1", [
      friendId,
    ]);
    return result.rows[0]?.username ?? null;
  }

  async listPlaylists(): Promise<Playlist[]> {
    const res = await dbQuery("SELECT * FROM playlists ORDER BY created_at DESC");
    return res.rows as Playlist[];
  }

  async listPlaylistTracksByPlaylistIds(
    playlistIds: number[]
  ): Promise<PlaylistTrackRow[]> {
    if (playlistIds.length === 0) return [];
    const res = await dbQuery(
      "SELECT playlist_id, track_id, friend_id, position FROM playlist_tracks WHERE playlist_id = ANY($1) ORDER BY position ASC",
      [playlistIds]
    );
    return res.rows as PlaylistTrackRow[];
  }

  async createPlaylist(name: string): Promise<Playlist> {
    const res = await dbQuery("INSERT INTO playlists (name) VALUES ($1) RETURNING *", [
      name,
    ]);
    return res.rows[0] as Playlist;
  }

  async findPlaylistById(id: number): Promise<Playlist | null> {
    const res = await dbQuery("SELECT * FROM playlists WHERE id = $1", [id]);
    return (res.rows[0] as Playlist | undefined) ?? null;
  }

  async findPlaylistHeaderById(id: number): Promise<{ id: number; name: string } | null> {
    const res = await dbQuery<{ id: number; name: string }>(
      "SELECT id, name FROM playlists WHERE id = $1",
      [id]
    );
    return res.rows[0] ?? null;
  }

  async updatePlaylistName(client: Queryable, id: number, name: string): Promise<void> {
    await client.query("UPDATE playlists SET name = $1 WHERE id = $2", [name, id]);
  }

  async deletePlaylistTracks(client: Queryable, playlistId: number): Promise<void> {
    await client.query("DELETE FROM playlist_tracks WHERE playlist_id = $1", [playlistId]);
  }

  async insertPlaylistTracks(
    client: Queryable,
    playlistId: number,
    tracks: Array<{ track_id: string; friend_id: number; position: number }>,
    onConflictDoNothing = false
  ): Promise<void> {
    if (tracks.length === 0) return;
    const values = tracks
      .map((_, i) => `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`)
      .join(",");
    const sql = `INSERT INTO playlist_tracks (playlist_id, track_id, friend_id, position) VALUES ${values}${
      onConflictDoNothing ? " ON CONFLICT DO NOTHING" : ""
    }`;
    const params: (string | number)[] = [playlistId];
    tracks.forEach((track) => {
      params.push(track.track_id, track.friend_id, track.position);
    });
    await client.query(sql, params);
  }

  async deletePlaylistById(id: number): Promise<Playlist | null> {
    const res = await dbQuery("DELETE FROM playlists WHERE id = $1 RETURNING *", [id]);
    return (res.rows[0] as Playlist | undefined) ?? null;
  }

  async listTrackRefsForPlaylist(
    playlistId: number
  ): Promise<Array<{ track_id: string; friend_id: number; position: number }>> {
    const res = await dbQuery(
      "SELECT track_id, friend_id, position FROM playlist_tracks WHERE playlist_id = $1 ORDER BY position ASC",
      [playlistId]
    );
    return res.rows as Array<{ track_id: string; friend_id: number; position: number }>;
  }

  async connect(): Promise<PoolClient> {
    return dbPool.connect();
  }
}

export const playlistRepository = new PlaylistRepository();
