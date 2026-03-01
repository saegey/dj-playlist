import { dbQuery } from "@/lib/serverDb";
import type { Track } from "@/types/track";

export type TrackLocalAudioRow = Pick<
  Track,
  "track_id" | "friend_id" | "local_audio_url"
>;

export type CoverArtBackfillCandidateRow = TrackRef & {
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

export type OrderedTrackRow = TrackWithLibraryIdentifierRow & {
  ord: number;
};

export type MissingMusicUrlPageResult = {
  tracks: Track[];
  total: number;
};

export type TrackReindexRow = TrackWithLibraryIdentifierRow;
export type TrackAnalysisBulkUpdate = Pick<Track, "local_audio_url"> & {
  bpm?: number | null;
  key?: string | null;
  danceability?: number | null;
  duration_seconds?: number | null;
};
export type TrackAudioMetadataRow = Pick<
  Track,
  | "track_id"
  | "friend_id"
  | "local_audio_url"
  | "audio_file_album_art_url"
  | "year"
  | "composer"
>;

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

  async listTrackIdsByFriendAndReleaseIds(
    friendId: number,
    releaseIds: string[]
  ): Promise<string[]> {
    if (releaseIds.length === 0) return [];
    const { rows } = await dbQuery<{ track_id: string }>(
      `
      SELECT track_id
      FROM tracks
      WHERE friend_id = $1 AND release_id = ANY($2::text[])
      `,
      [friendId, releaseIds]
    );
    return rows.map((row) => row.track_id);
  }

  async deleteTracksByFriendAndReleaseIds(
    friendId: number,
    releaseIds: string[]
  ): Promise<number> {
    if (releaseIds.length === 0) return 0;
    const result = await dbQuery(
      "DELETE FROM tracks WHERE friend_id = $1 AND release_id = ANY($2::text[])",
      [friendId, releaseIds]
    );
    return result.rowCount ?? 0;
  }

  async findTracksByRefsPreservingOrder(
    tracks: TrackRef[]
  ): Promise<OrderedTrackRow[]> {
    if (tracks.length === 0) return [];

    const values: string[] = [];
    const params: Array<string | number> = [];
    let p = 1;
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      values.push(`($${p++}::text,$${p++}::int,$${p++}::int)`);
      params.push(t.track_id, t.friend_id, i);
    }

    const { rows } = await dbQuery<OrderedTrackRow>(
      `
      SELECT
        t.*,
        COALESCE(a.library_identifier, t.library_identifier) AS library_identifier,
        v.ord
      FROM (VALUES ${values.join(",")}) AS v(track_id, friend_id, ord)
      JOIN tracks t
        ON t.track_id = v.track_id AND t.friend_id = v.friend_id
      LEFT JOIN albums a
        ON t.release_id = a.release_id AND t.friend_id = a.friend_id
      ORDER BY v.ord
      `,
      params
    );
    return rows;
  }

  async findMissingMusicUrlTracksPaginated(params: {
    pageSize: number;
    offset: number;
    friendId?: string | null;
  }): Promise<MissingMusicUrlPageResult> {
    const { pageSize, offset, friendId } = params;
    const whereBase =
      "(apple_music_url IS NULL OR apple_music_url = '') AND (youtube_url IS NULL OR youtube_url = '') AND (soundcloud_url IS NULL OR soundcloud_url = '')";

    const where = friendId ? `${whereBase} AND friend_id = $1` : whereBase;
    const countValues: Array<string | number> = friendId ? [friendId] : [];
    const tracksValues: Array<string | number> = friendId
      ? [friendId, pageSize, offset]
      : [pageSize, offset];

    const countQuery = `SELECT COUNT(*) FROM tracks WHERE ${where}`;
    const tracksQuery = `
      SELECT *
      FROM tracks
      WHERE ${where}
      ORDER BY id DESC
      LIMIT $${friendId ? 2 : 1}
      OFFSET $${friendId ? 3 : 2}
    `;

    const [countResult, tracksResult] = await Promise.all([
      dbQuery<{ count: string }>(countQuery, countValues),
      dbQuery<Track>(tracksQuery, tracksValues),
    ]);

    return {
      tracks: tracksResult.rows,
      total: parseInt(countResult.rows[0]?.count ?? "0", 10),
    };
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

  async updateTrackLocalAudioUrl(
    trackId: string,
    friendId: number,
    localAudioUrl: string
  ): Promise<void> {
    await dbQuery(
      "UPDATE tracks SET local_audio_url = $1 WHERE track_id = $2 AND friend_id = $3",
      [localAudioUrl, trackId, friendId]
    );
  }

  async findTrackByTrackIdAndFriendIdRaw(
    trackId: string,
    friendId: number
  ): Promise<Track | null> {
    const { rows } = await dbQuery<Track>(
      "SELECT * FROM tracks WHERE track_id = $1 AND friend_id = $2 LIMIT 1",
      [trackId, friendId]
    );
    return rows[0] ?? null;
  }

  async findTrackAudioMetadata(
    trackId: string,
    friendId: number
  ): Promise<TrackAudioMetadataRow | null> {
    const { rows } = await dbQuery<TrackAudioMetadataRow>(
      `
      SELECT track_id, friend_id, local_audio_url, audio_file_album_art_url, year, composer
      FROM tracks
      WHERE track_id = $1 AND friend_id = $2
      LIMIT 1
      `,
      [trackId, friendId]
    );
    return rows[0] ?? null;
  }

  async findEmbeddingPromptTemplateByFriendId(
    friendId: number
  ): Promise<string | null> {
    const { rows } = await dbQuery<{ prompt_template: string | null }>(
      `
      SELECT prompt_template
      FROM embedding_prompt_settings
      WHERE friend_id = $1
      LIMIT 1
      `,
      [friendId]
    );

    return typeof rows[0]?.prompt_template === "string"
      ? rows[0].prompt_template
      : null;
  }

  async findTracksByTrackId(trackId: string): Promise<Track[]> {
    const { rows } = await dbQuery<Track>(
      "SELECT * FROM tracks WHERE track_id = $1",
      [trackId]
    );
    return rows;
  }

  async updateTrackAnalysisByTrackId(
    trackId: string,
    updates: TrackAnalysisBulkUpdate
  ): Promise<void> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;

    if (typeof updates.local_audio_url === "string") {
      sets.push(`local_audio_url = $${i++}`);
      vals.push(updates.local_audio_url);
    }
    if (typeof updates.bpm === "number") {
      sets.push(`bpm = $${i++}`);
      vals.push(updates.bpm);
    } else if (updates.bpm === null) {
      sets.push(`bpm = $${i++}`);
      vals.push(null);
    }
    if (typeof updates.key === "string") {
      sets.push(`key = $${i++}`);
      vals.push(updates.key);
    } else if (updates.key === null) {
      sets.push(`key = $${i++}`);
      vals.push(null);
    }
    if (typeof updates.danceability === "number") {
      sets.push(`danceability = $${i++}`);
      vals.push(updates.danceability);
    } else if (updates.danceability === null) {
      sets.push(`danceability = $${i++}`);
      vals.push(null);
    }
    if (typeof updates.duration_seconds === "number") {
      sets.push(`duration_seconds = $${i++}`);
      vals.push(updates.duration_seconds);
    } else if (updates.duration_seconds === null) {
      sets.push(`duration_seconds = $${i++}`);
      vals.push(null);
    }

    if (sets.length === 0) return;

    vals.push(trackId);
    await dbQuery(
      `UPDATE tracks SET ${sets.join(", ")} WHERE track_id = $${i}`,
      vals
    );
  }

  async updateTrackNotesAndTagsByTrackId(
    trackId: string,
    localTags: string,
    notes: string
  ): Promise<void> {
    await dbQuery(
      `UPDATE tracks SET local_tags = $1, notes = $2 WHERE track_id = $3`,
      [localTags, notes, trackId]
    );
  }

  async updateTrackAudioFileAlbumArtUrl(
    trackId: string,
    friendId: number,
    audioFileAlbumArtUrl: string
  ): Promise<void> {
    await dbQuery(
      `
      UPDATE tracks
      SET audio_file_album_art_url = $1
      WHERE track_id = $2 AND friend_id = $3
      `,
      [audioFileAlbumArtUrl, trackId, friendId]
    );
  }

  async updateTrackYear(
    trackId: string,
    friendId: number,
    year: string
  ): Promise<void> {
    await dbQuery(
      `
      UPDATE tracks
      SET year = $1
      WHERE track_id = $2 AND friend_id = $3
      `,
      [year, trackId, friendId]
    );
  }

  async updateTrackComposer(
    trackId: string,
    friendId: number,
    composer: string
  ): Promise<void> {
    await dbQuery(
      `
      UPDATE tracks
      SET composer = $1
      WHERE track_id = $2 AND friend_id = $3
      `,
      [composer, trackId, friendId]
    );
  }

  async updateTrackEmbeddingByTrackIdAndUsername(
    trackId: string,
    username: string,
    embedding: number[]
  ): Promise<void> {
    const pgVector = `[${embedding.join(",")}]`;
    await dbQuery(
      "UPDATE tracks SET embedding = $1 WHERE track_id = $2 AND username = $3",
      [pgVector, trackId, username]
    );
  }

  async listTracksForReindex(): Promise<TrackReindexRow[]> {
    const { rows } = await dbQuery<TrackReindexRow>(
      `
      SELECT
        t.*,
        a.library_identifier,
        COALESCE(f.username, t.username) AS username
      FROM tracks t
      LEFT JOIN albums a
        ON t.release_id = a.release_id AND t.friend_id = a.friend_id
      LEFT JOIN friends f
        ON t.friend_id = f.id
      `
    );
    return rows;
  }
}

export const trackRepository = new TrackRepository();
