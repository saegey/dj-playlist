import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

export class TrackRepository {
  async findTrackWithLocalAudio(
    trackId: string,
    friendId: number
  ): Promise<TrackLocalAudioRow | null> {
    const { rows } = await pool.query<TrackLocalAudioRow>(
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
    const { rows } = await pool.query<TrackLocalAudioRow>(
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

    const { rows } = await pool.query<TrackLocalAudioRow>(
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

    const { rows } = await pool.query<CoverArtBackfillCandidateRow>(
      query,
      friendId !== null ? [friendId] : []
    );
    return rows;
  }
}

export const trackRepository = new TrackRepository();
