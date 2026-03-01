import type { PoolClient } from "pg";
import { dbQuery } from "@/lib/serverDb";
import type { BackfillOptions } from "@/types/backfill";
import type {
  EmbeddingTrackRef,
  SimilarIdentityTrack,
  SimilarityFilters,
  SimilarVibeTrack,
} from "@/types/embeddings";

type Queryable = Pick<PoolClient, "query">;

type SimilarIdentityTrackRow = Omit<SimilarIdentityTrack, "distance"> & {
  distance: string | number;
};

type SimilarVibeTrackRow = Omit<SimilarVibeTrack, "distance"> & {
  distance: string | number;
};

export class EmbeddingsRepository {
  async listTracksNeedingIdentityEmbeddings(
    options: BackfillOptions
  ): Promise<EmbeddingTrackRef[]> {
    const { friend_id, force, limit } = options;
    const params: Array<number> = [];
    let query = "";

    if (force) {
      query = `
        SELECT track_id, friend_id
        FROM tracks
        ${friend_id ? "WHERE friend_id = $1" : ""}
        ORDER BY friend_id, track_id
        ${limit ? `LIMIT $${friend_id ? 2 : 1}` : ""}
      `;
      if (friend_id) params.push(friend_id);
      if (limit) params.push(limit);
    } else {
      query = `
        SELECT t.track_id, t.friend_id
        FROM tracks t
        LEFT JOIN track_embeddings te
          ON t.track_id = te.track_id
          AND t.friend_id = te.friend_id
          AND te.embedding_type = 'identity'
        WHERE te.id IS NULL
        ${friend_id ? "AND t.friend_id = $1" : ""}
        ORDER BY t.friend_id, t.track_id
        ${limit ? `LIMIT $${friend_id ? 2 : 1}` : ""}
      `;
      if (friend_id) params.push(friend_id);
      if (limit) params.push(limit);
    }

    const result = await dbQuery<EmbeddingTrackRef>(query, params);
    return result.rows;
  }

  async setIvfflatProbes(client: Queryable, probes: number): Promise<void> {
    await client.query("SELECT set_config('ivfflat.probes', $1, false)", [
      String(probes),
    ]);
  }

  async findSourceEmbedding(
    client: Queryable,
    trackId: string,
    friendId: number,
    embeddingType: "identity" | "audio_vibe"
  ): Promise<unknown | null> {
    const result = await client.query<{ embedding: unknown }>(
      `
      SELECT embedding
      FROM track_embeddings
      WHERE track_id = $1 AND friend_id = $2 AND embedding_type = $3
      LIMIT 1
      `,
      [trackId, friendId, embeddingType]
    );
    return result.rows[0]?.embedding ?? null;
  }

  async findSimilarIdentityTracks(
    client: Queryable,
    params: {
      sourceEmbedding: unknown;
      sourceTrackId: string;
      sourceFriendId: number;
      limit: number;
      filters: SimilarityFilters;
    }
  ): Promise<SimilarIdentityTrack[]> {
    const { sourceEmbedding, sourceTrackId, sourceFriendId, limit, filters } = params;
    const queryParams: unknown[] = [sourceEmbedding, sourceTrackId, sourceFriendId];
    const filterClauses: string[] = [];
    let idx = 4;

    if (filters.country) {
      filterClauses.push(`a.country = $${idx++}`);
      queryParams.push(filters.country);
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagClauses = filters.tags.map(() => `LOWER(t.local_tags) LIKE $${idx++}`);
      filterClauses.push(`(${tagClauses.join(" OR ")})`);
      queryParams.push(...filters.tags.map((tag) => `%${tag.toLowerCase()}%`));
    }

    queryParams.push(limit);

    const result = await client.query<SimilarIdentityTrackRow>(
      `
      SELECT
        t.track_id,
        t.friend_id,
        t.title,
        t.artist,
        t.album,
        t.year,
        COALESCE(t.genres, '{}') AS genres,
        COALESCE(t.styles, '{}') AS styles,
        COALESCE(t.local_tags, '') AS local_tags,
        t.album_thumbnail,
        t.audio_file_album_art_url,
        t.bpm,
        t.key,
        t.star_rating,
        t.duration_seconds,
        t.position,
        t.discogs_url,
        t.apple_music_url,
        t.spotify_url,
        t.youtube_url,
        t.local_audio_url,
        te.identity_text,
        te.embedding <=> $1 AS distance
      FROM track_embeddings te
      JOIN tracks t ON te.track_id = t.track_id AND te.friend_id = t.friend_id
      LEFT JOIN albums a ON t.release_id = a.release_id AND t.friend_id = a.friend_id
      WHERE te.embedding_type = 'identity'
        AND NOT (te.track_id = $2 AND te.friend_id = $3)
        ${filterClauses.length > 0 ? `AND ${filterClauses.join(" AND ")}` : ""}
      ORDER BY te.embedding <=> $1
      LIMIT $${idx}
      `,
      queryParams
    );

    return result.rows.map((row) => ({
      ...row,
      distance: Number(row.distance),
    }));
  }

  async findSimilarAudioVibeTracks(
    client: Queryable,
    params: {
      sourceEmbedding: unknown;
      sourceTrackId: string;
      sourceFriendId: number;
      limit: number;
    }
  ): Promise<SimilarVibeTrack[]> {
    const result = await client.query<SimilarVibeTrackRow>(
      `
      SELECT
        t.track_id,
        t.friend_id,
        t.title,
        t.artist,
        t.album,
        t.year,
        COALESCE(t.genres, '{}') AS genres,
        COALESCE(t.styles, '{}') AS styles,
        COALESCE(t.local_tags, '') AS local_tags,
        t.album_thumbnail,
        t.audio_file_album_art_url,
        t.bpm,
        t.key,
        t.star_rating,
        t.duration_seconds,
        t.position,
        t.discogs_url,
        t.apple_music_url,
        t.spotify_url,
        t.youtube_url,
        t.local_audio_url,
        t.danceability,
        t.mood_happy,
        t.mood_sad,
        t.mood_relaxed,
        t.mood_aggressive,
        te.identity_text,
        te.embedding <=> $1 AS distance
      FROM track_embeddings te
      JOIN tracks t ON te.track_id = t.track_id AND te.friend_id = t.friend_id
      WHERE te.embedding_type = 'audio_vibe'
        AND NOT (te.track_id = $2 AND te.friend_id = $3)
      ORDER BY te.embedding <=> $1
      LIMIT $4
      `,
      [params.sourceEmbedding, params.sourceTrackId, params.sourceFriendId, params.limit]
    );

    return result.rows.map((row) => ({
      ...row,
      distance: Number(row.distance),
    }));
  }
}

export const embeddingsRepository = new EmbeddingsRepository();
