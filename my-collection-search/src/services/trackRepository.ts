import { dbQuery } from "@/lib/serverDb";
import type { Track } from "@/types/track";

export type TrackLocalAudioRow = {
  track_id: string;
  friend_id: number;
  local_audio_url: string | null;
};

export type CoverArtBackfillCandidateRow = {
  track_id: string;
  friend_id: number;
  release_id: string | null;
  missing_tracks: string | number;
};

export type TrackRef = Pick<Track, "track_id" | "friend_id">;

type UpdatableTrackFields = Partial<
  Pick<
    Track,
    | "title"
    | "artist"
    | "album"
    | "year"
    | "local_tags"
    | "apple_music_url"
    | "local_audio_url"
    | "audio_file_album_art_url"
    | "youtube_url"
    | "soundcloud_url"
    | "spotify_url"
    | "duration_seconds"
    | "notes"
    | "bpm"
    | "key"
    | "danceability"
    | "star_rating"
  >
>;

export type UpdateTrackInput = TrackRef & UpdatableTrackFields;

export type TrackWithLibraryIdentifierRow = Track & {
  library_identifier?: string | null;
};

export type TrackPlaylistMembershipRow = {
  id: number;
  name: string;
  position: number;
};

const UPDATABLE_COLUMNS = {
  title: "title",
  artist: "artist",
  album: "album",
  year: "year",
  local_tags: "local_tags",
  apple_music_url: "apple_music_url",
  youtube_url: "youtube_url",
  soundcloud_url: "soundcloud_url",
  spotify_url: "spotify_url",
  local_audio_url: "local_audio_url",
  audio_file_album_art_url: "audio_file_album_art_url",
  duration_seconds: "duration_seconds",
  notes: "notes",
  bpm: "bpm",
  key: "key",
  danceability: "danceability",
  star_rating: "star_rating",
} as const;

export class TrackRepository {
  async findTrackWithLocalAudio(
    trackId: string,
    friendId: number
  ): Promise<TrackLocalAudioRow | null> {
    const { rows } = await dbQuery<TrackLocalAudioRow>(
      `
      SELECT track_id, friend_id, local_audio_url
      FROM tracks
      WHERE track_id = $1 AND friend_id = $2
      LIMIT 1
      `,
      [trackId, friendId]
    );
    return rows[0] ?? null;
  }

  async findTracksMissingDurationWithLocalM4a(): Promise<TrackLocalAudioRow[]> {
    const { rows } = await dbQuery<TrackLocalAudioRow>(
      `
      SELECT track_id, friend_id, local_audio_url
      FROM tracks
      WHERE duration_seconds IS NULL
        AND local_audio_url LIKE '%.m4a'
      `
    );
    return rows;
  }

  async findTracksForEssentiaBackfill(friendId: number | null): Promise<TrackLocalAudioRow[]> {
    const query = `
      SELECT track_id, friend_id, local_audio_url
      FROM tracks
      WHERE local_audio_url IS NOT NULL
        AND local_audio_url <> ''
        ${friendId !== null ? "AND friend_id = $1" : ""}
      ORDER BY friend_id, track_id
    `;

    const { rows } = await dbQuery<TrackLocalAudioRow>(
      query,
      friendId !== null ? [friendId] : []
    );
    return rows;
  }

  async findCoverArtBackfillCandidates(
    friendId: number | null
  ): Promise<CoverArtBackfillCandidateRow[]> {
    const query = `
      SELECT
        MIN(track_id) AS track_id,
        friend_id,
        release_id::text AS release_id,
        COUNT(*) AS missing_tracks
      FROM tracks
      WHERE local_audio_url IS NOT NULL
        AND local_audio_url <> ''
        AND (audio_file_album_art_url IS NULL OR audio_file_album_art_url = '')
        AND release_id IS NOT NULL
        AND release_id::text <> ''
        ${friendId !== null ? "AND friend_id = $1" : ""}
      GROUP BY friend_id, release_id::text
    `;

    const { rows } = await dbQuery<CoverArtBackfillCandidateRow>(
      query,
      friendId !== null ? [friendId] : []
    );
    return rows;
  }

  async getAllTracksWithLibraryIdentifier(): Promise<TrackWithLibraryIdentifierRow[]> {
    const { rows } = await dbQuery<TrackWithLibraryIdentifierRow>(
      `
      SELECT t.*, a.library_identifier
      FROM tracks t
      LEFT JOIN albums a ON t.release_id = a.release_id AND t.friend_id = a.friend_id
      ORDER BY t.id DESC
      `
    );
    return rows;
  }

  async getPlaylistCountsForTracks(
    trackRefs: TrackRef[]
  ): Promise<Record<string, number>> {
    if (!trackRefs || trackRefs.length === 0) return {};

    const values: string[] = [];
    const params: Array<string | number> = [];
    trackRefs.forEach((ref, idx) => {
      const offset = idx * 2;
      values.push(`($${offset + 1}::text, $${offset + 2}::integer)`);
      params.push(ref.track_id, ref.friend_id);
    });

    const { rows } = await dbQuery<{
      track_id: string;
      friend_id: number;
      count: string | number;
    }>(
      `
      WITH refs(track_id, friend_id) AS (
        VALUES ${values.join(", ")}
      )
      SELECT
        r.track_id,
        r.friend_id,
        COUNT(DISTINCT pt.playlist_id) AS count
      FROM refs r
      LEFT JOIN playlist_tracks pt
        ON pt.track_id = r.track_id AND pt.friend_id = r.friend_id
      GROUP BY r.track_id, r.friend_id
      `,
      params
    );

    const result: Record<string, number> = {};
    for (const row of rows) {
      const key = `${row.track_id}:${row.friend_id}`;
      result[key] = Number(row.count);
    }

    for (const ref of trackRefs) {
      const key = `${ref.track_id}:${ref.friend_id}`;
      if (!(key in result)) result[key] = 0;
    }

    return result;
  }

  async findTrackByTrackIdAndFriendId(
    trackId: string,
    friendId: number
  ): Promise<TrackWithLibraryIdentifierRow | null> {
    const { rows } = await dbQuery<TrackWithLibraryIdentifierRow>(
      `
      SELECT t.*, a.library_identifier
      FROM tracks t
      LEFT JOIN albums a ON t.release_id = a.release_id AND t.friend_id = a.friend_id
      WHERE t.track_id = $1 AND t.friend_id = $2
      LIMIT 1
      `,
      [trackId, friendId]
    );
    return rows[0] ?? null;
  }

  async findTrackByTrackIdAndFriendIdWithLibraryFallback(
    trackId: string,
    friendId: number
  ): Promise<TrackWithLibraryIdentifierRow | null> {
    const { rows } = await dbQuery<TrackWithLibraryIdentifierRow>(
      `
      SELECT
        t.*,
        COALESCE(a.library_identifier, t.library_identifier) AS library_identifier
      FROM tracks t
      LEFT JOIN albums a
        ON t.release_id = a.release_id AND t.friend_id = a.friend_id
      WHERE t.track_id = $1 AND t.friend_id = $2
      LIMIT 1
      `,
      [trackId, friendId]
    );
    return rows[0] ?? null;
  }

  async listPlaylistsForTrack(
    trackId: string,
    friendId: number
  ): Promise<TrackPlaylistMembershipRow[]> {
    const { rows } = await dbQuery<TrackPlaylistMembershipRow>(
      `
      SELECT
        p.id,
        p.name,
        pt.position
      FROM playlist_tracks pt
      JOIN playlists p ON p.id = pt.playlist_id
      WHERE pt.track_id = $1 AND pt.friend_id = $2
      ORDER BY p.name ASC, pt.position ASC
      `,
      [trackId, friendId]
    );
    return rows;
  }

  async updateTrackFields(
    data: UpdateTrackInput
  ): Promise<TrackWithLibraryIdentifierRow | null> {
    const { track_id, friend_id, ...fields } = data;
    if (!track_id || !friend_id) return null;

    const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
    if (entries.length === 0) {
      return this.findTrackByTrackIdAndFriendId(track_id, friend_id);
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, value] of entries) {
      if (!(key in UPDATABLE_COLUMNS)) continue;
      const col = UPDATABLE_COLUMNS[key as keyof typeof UPDATABLE_COLUMNS];
      if (col === "duration_seconds" || col === "bpm") {
        setClauses.push(`${col} = $${idx}::integer`);
      } else {
        setClauses.push(`${col} = $${idx}`);
      }
      values.push(value);
      idx++;
    }

    if (setClauses.length === 0) {
      return this.findTrackByTrackIdAndFriendId(track_id, friend_id);
    }

    values.push(track_id, friend_id);
    await dbQuery(
      `
      UPDATE tracks
      SET ${setClauses.join(", ")}
      WHERE track_id = $${idx} AND friend_id = $${idx + 1}
      `,
      values
    );

    return this.findTrackByTrackIdAndFriendId(track_id, friend_id);
  }

  async updateTrackEmbedding(
    trackId: string,
    friendId: number,
    embedding: number[]
  ): Promise<void> {
    const pgVector = `[${embedding.join(",")}]`;
    await dbQuery(
      "UPDATE tracks SET embedding = $1 WHERE track_id = $2 AND friend_id = $3",
      [pgVector, trackId, friendId]
    );
  }
}

export const trackRepository = new TrackRepository();
