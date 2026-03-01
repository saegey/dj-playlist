import {
  playlistRepository,
  type PlaylistTrackRow,
  type Queryable,
} from "@/services/playlistRepository";

export type PlaylistTrackInput = {
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
};

function normalizeStringArray(arr?: unknown): string[] | null {
  if (!arr) return null;
  if (Array.isArray(arr)) return arr.map(String);
  return null;
}

export function normalizePlaylistCreatedAt<T extends { created_at?: unknown }>(
  playlist: T
): T & { created_at: string } {
  const raw = playlist.created_at;
  const createdAt =
    raw instanceof Date
      ? raw.toISOString()
      : typeof raw === "string"
      ? raw
      : new Date(raw as string | number).toISOString();
  return {
    ...playlist,
    created_at: createdAt,
  };
}

export class PlaylistManagementService {
  async getAllPlaylistsWithTracks(): Promise<
    Array<{ id: number; name: string; created_at: string; tracks: PlaylistTrackRow[] }>
  > {
    const playlists = await playlistRepository.listPlaylists();
    if (playlists.length === 0) return [];

    const playlistIds = playlists.map((p) => p.id);
    const playlistTracks =
      await playlistRepository.listPlaylistTracksByPlaylistIds(playlistIds);
    const tracksByPlaylist: Record<number, PlaylistTrackRow[]> = {};

    playlistTracks.forEach((row) => {
      if (!tracksByPlaylist[row.playlist_id]) tracksByPlaylist[row.playlist_id] = [];
      tracksByPlaylist[row.playlist_id].push(row);
    });

    return playlists.map((playlist) =>
      normalizePlaylistCreatedAt({
        ...playlist,
        tracks: tracksByPlaylist[playlist.id] || [],
      })
    );
  }

  async createPlaylistWithTracks(data: {
    name: string;
    tracks: PlaylistTrackInput[];
  }): Promise<{
    id: number;
    name: string;
    created_at: string;
    tracks: Array<{ track_id: string; friend_id?: number; position?: number | null }>;
  }> {
    const playlist = await playlistRepository.createPlaylist(data.name);
    const tracks = data.tracks || [];
    if (tracks.length === 0) {
      return { ...playlist, tracks: [] };
    }

    const resolvedTracks = await Promise.all(
      tracks.map(async (track, i) => {
        const friendId = await this.resolveFriendIdForTrack(
          track.track_id,
          track.username ?? undefined
        );
        return {
          ...track,
          friend_id: friendId,
          position: i,
        };
      })
    );

    const client = await playlistRepository.connect();
    try {
      await this.upsertTracksWithMetadata(resolvedTracks, client);
      await playlistRepository.insertPlaylistTracks(
        client,
        playlist.id,
        resolvedTracks.map((track) => ({
          track_id: track.track_id,
          friend_id: track.friend_id!,
          position: track.position ?? 0,
        })),
        true
      );
    } finally {
      client.release();
    }

    return {
      ...playlist,
      tracks: tracks.map((track) => ({
        track_id: track.track_id,
        friend_id: track.friend_id,
        position: track.position,
      })),
    };
  }

  async updatePlaylist(data: {
    id: number;
    name?: string;
    tracks?: Array<string | PlaylistTrackInput>;
    default_friend_id?: number;
  }): Promise<
    | { notFound: true }
    | {
        notFound: false;
        playlist: {
          id: number;
          name: string;
          created_at: string;
          tracks: Array<{ track_id: string; friend_id: number; position: number }>;
        };
      }
  > {
    const client = await playlistRepository.connect();
    try {
      await client.query("BEGIN");
      const exists = await playlistRepository.findPlaylistHeaderById(data.id);
      if (!exists) {
        await client.query("ROLLBACK");
        return { notFound: true };
      }

      if (data.name !== undefined) {
        await playlistRepository.updatePlaylistName(client, data.id, data.name);
      }

      if (data.tracks !== undefined) {
        await playlistRepository.deletePlaylistTracks(client, data.id);
        if (data.tracks.length > 0) {
          const resolvedTracks = await Promise.all(
            data.tracks.map(async (track, i) => {
              const trackId = typeof track === "string" ? track : track.track_id;
              const username =
                typeof track === "object" ? track.username ?? undefined : undefined;

              const rawFriendId =
                typeof track === "object" ? track.friend_id : undefined;
              let friendId =
                typeof rawFriendId === "number" && Number.isFinite(rawFriendId)
                  ? rawFriendId
                  : undefined;

              if (!friendId && data.default_friend_id) {
                friendId = data.default_friend_id;
              }

              if (!friendId) {
                friendId = await this.resolveFriendIdForTrack(trackId, username);
              }

              return {
                ...(typeof track === "object" ? track : { track_id: trackId }),
                track_id: trackId,
                friend_id: friendId,
                position: i,
              };
            })
          );

          await this.upsertTracksWithMetadata(resolvedTracks, client);
          await playlistRepository.insertPlaylistTracks(
            client,
            data.id,
            resolvedTracks.map((track) => ({
              track_id: track.track_id,
              friend_id: track.friend_id!,
              position: track.position ?? 0,
            }))
          );
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const playlist = await playlistRepository.findPlaylistById(data.id);
    const tracks = await playlistRepository.listTrackRefsForPlaylist(data.id);

    if (!playlist) return { notFound: true };
    return {
      notFound: false,
      playlist: normalizePlaylistCreatedAt({
        ...playlist,
        tracks,
      }),
    };
  }

  private async resolveFriendIdForTrack(
    trackId: string,
    username?: string
  ): Promise<number> {
    if (username) {
      const id = await playlistRepository.findFriendIdByUsername(username);
      if (id) return id;
    }
    const ownerId = await playlistRepository.findAnyFriendIdForTrack(trackId);
    if (ownerId) return ownerId;
    return playlistRepository.getDefaultFriendId();
  }

  private async upsertTracksWithMetadata(
    tracks: PlaylistTrackInput[],
    db: Queryable
  ): Promise<void> {
    if (!tracks.length) return;

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

      const updateParams: unknown[] = [];
      const setClauses: string[] = [];
      let idx = 1;
      for (const col of columns) {
        setClauses.push(`${col} = COALESCE($${idx}, ${col})`);
        updateParams.push(updateValues[col]);
        idx += 1;
      }
      updateParams.push(rawTrack.track_id, rawTrack.friend_id);

      const updateSql = `
        UPDATE tracks
        SET ${setClauses.join(", ")}
        WHERE track_id = $${idx} AND friend_id = $${idx + 1}
        RETURNING track_id;
      `;
      const updateRes = await db.query(updateSql, updateParams);
      if ((updateRes as { rowCount?: number }).rowCount) continue;

      const insertTitle = title ?? rawTrack.track_id;
      const insertArtist = artist ?? "Unknown Artist";
      let username = rawTrack.username;
      if (!username) {
        username = await playlistRepository.findFriendUsernameById(rawTrack.friend_id);
      }

      if (!username) {
        throw new Error(
          `Cannot insert track ${rawTrack.track_id}: username is required but not found for friend_id ${rawTrack.friend_id}`
        );
      }

      const insertValues = { ...updateValues, title: insertTitle, artist: insertArtist, username };
      const insertColumns = ["track_id", "friend_id", ...columns] as const;
      const insertParams: unknown[] = [
        rawTrack.track_id,
        rawTrack.friend_id,
        ...columns.map((col) => insertValues[col]),
      ];
      const placeholders = insertColumns.map((_, i) => `$${i + 1}`).join(", ");
      const insertSql = `
        INSERT INTO tracks (${insertColumns.join(", ")})
        VALUES (${placeholders})
        ON CONFLICT (track_id) DO NOTHING;
      `;
      await db.query(insertSql, insertParams);
    }
  }
}

export const playlistManagementService = new PlaylistManagementService();
