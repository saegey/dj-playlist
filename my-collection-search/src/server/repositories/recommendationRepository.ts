import { withDbClient } from "@/lib/serverDb";

export type SeedTrackPair = {
  trackId: string;
  friendId: number;
};

export type RecommendationCandidateRow = {
  track_id: string;
  friend_id: number;
  distance: number;
  title: string;
  artist: string;
  album: string;
  year: string | null;
  bpm: number | null;
  key: string | null;
  genres: string[];
  styles: string[];
  local_tags: string;
  danceability: number | null;
  mood_happy: number | null;
  mood_sad: number | null;
  mood_relaxed: number | null;
  mood_aggressive: number | null;
  star_rating: number | null;
};

type RecommendationCandidateRowRaw = Omit<RecommendationCandidateRow, "distance"> & {
  distance: string | number;
};

function buildSeedValues(seedTracks: SeedTrackPair[]): {
  valuesClause: string;
  params: Array<string | number>;
  limitParamIndex: number;
} {
  const params: Array<string | number> = [];
  const tuples: string[] = [];

  for (let i = 0; i < seedTracks.length; i += 1) {
    const offset = i * 2;
    tuples.push(`($${offset + 1}::text, $${offset + 2}::integer)`);
    params.push(seedTracks[i].trackId, seedTracks[i].friendId);
  }

  return {
    valuesClause: tuples.join(", "),
    params,
    limitParamIndex: seedTracks.length * 2 + 1,
  };
}

function normalizeRows(rows: RecommendationCandidateRowRaw[]): RecommendationCandidateRow[] {
  return rows.map((row) => ({ ...row, distance: Number(row.distance) }));
}

export class RecommendationRepository {
  async findIdentitySimilar(params: {
    seedTrackId: string;
    seedFriendId: number;
    limit: number;
    ivfflatProbes: number;
  }): Promise<RecommendationCandidateRow[]> {
    return withDbClient(async (client) => {
      await client.query("SELECT set_config('ivfflat.probes', $1, false)", [
        String(params.ivfflatProbes),
      ]);

      const embeddingResult = await client.query<{ embedding: unknown }>(
        `SELECT embedding FROM track_embeddings
         WHERE track_id = $1 AND friend_id = $2 AND embedding_type = 'identity'`,
        [params.seedTrackId, params.seedFriendId]
      );

      if (embeddingResult.rows.length === 0) {
        return [];
      }

      const seedEmbedding = embeddingResult.rows[0].embedding;
      const result = await client.query<RecommendationCandidateRowRaw>(
        `
        SELECT
          t.track_id,
          t.friend_id,
          t.title,
          t.artist,
          t.album,
          t.year,
          t.bpm,
          t.key,
          t.genres,
          t.styles,
          t.local_tags,
          t.danceability,
          t.mood_happy,
          t.mood_sad,
          t.mood_relaxed,
          t.mood_aggressive,
          t.star_rating,
          te.embedding <=> $1 AS distance
        FROM track_embeddings te
        JOIN tracks t ON te.track_id = t.track_id AND te.friend_id = t.friend_id
        WHERE te.embedding_type = 'identity'
          AND NOT (te.track_id = $2 AND te.friend_id = $3)
        ORDER BY te.embedding <=> $1
        LIMIT $4
        `,
        [seedEmbedding, params.seedTrackId, params.seedFriendId, params.limit]
      );

      return normalizeRows(result.rows);
    });
  }

  async findAudioSimilar(params: {
    seedTrackId: string;
    seedFriendId: number;
    limit: number;
    ivfflatProbes: number;
  }): Promise<RecommendationCandidateRow[]> {
    return withDbClient(async (client) => {
      await client.query("SELECT set_config('ivfflat.probes', $1, false)", [
        String(params.ivfflatProbes),
      ]);

      const embeddingResult = await client.query<{ embedding: unknown }>(
        `SELECT embedding FROM track_embeddings
         WHERE track_id = $1 AND friend_id = $2 AND embedding_type = 'audio_vibe'`,
        [params.seedTrackId, params.seedFriendId]
      );

      if (embeddingResult.rows.length === 0) {
        return [];
      }

      const seedEmbedding = embeddingResult.rows[0].embedding;
      const result = await client.query<RecommendationCandidateRowRaw>(
        `
        SELECT
          t.track_id,
          t.friend_id,
          t.title,
          t.artist,
          t.album,
          t.year,
          t.bpm,
          t.key,
          t.genres,
          t.styles,
          t.local_tags,
          t.danceability,
          t.mood_happy,
          t.mood_sad,
          t.mood_relaxed,
          t.mood_aggressive,
          t.star_rating,
          te.embedding <=> $1 AS distance
        FROM track_embeddings te
        JOIN tracks t ON te.track_id = t.track_id AND te.friend_id = t.friend_id
        WHERE te.embedding_type = 'audio_vibe'
          AND NOT (te.track_id = $2 AND te.friend_id = $3)
        ORDER BY te.embedding <=> $1
        LIMIT $4
        `,
        [seedEmbedding, params.seedTrackId, params.seedFriendId, params.limit]
      );

      return normalizeRows(result.rows);
    });
  }

  async findIdentitySimilarByCentroid(params: {
    seedTracks: SeedTrackPair[];
    limit: number;
    ivfflatProbes: number;
  }): Promise<RecommendationCandidateRow[]> {
    if (params.seedTracks.length === 0) return [];

    return withDbClient(async (client) => {
      await client.query("SELECT set_config('ivfflat.probes', $1, false)", [
        String(params.ivfflatProbes),
      ]);

      const { valuesClause, params: queryParams, limitParamIndex } = buildSeedValues(
        params.seedTracks
      );

      const result = await client.query<RecommendationCandidateRowRaw>(
        `
        WITH seeds(track_id, friend_id) AS (
          VALUES ${valuesClause}
        ),
        seed_embedding AS (
          SELECT AVG(te.embedding) AS embedding
          FROM track_embeddings te
          JOIN seeds s
            ON te.track_id = s.track_id
           AND te.friend_id = s.friend_id
          WHERE te.embedding_type = 'identity'
        )
        SELECT
          t.track_id,
          t.friend_id,
          t.title,
          t.artist,
          t.album,
          t.year,
          t.bpm,
          t.key,
          t.genres,
          t.styles,
          t.local_tags,
          t.danceability,
          t.mood_happy,
          t.mood_sad,
          t.mood_relaxed,
          t.mood_aggressive,
          t.star_rating,
          te.embedding <=> se.embedding AS distance
        FROM track_embeddings te
        JOIN tracks t ON te.track_id = t.track_id AND te.friend_id = t.friend_id
        CROSS JOIN seed_embedding se
        WHERE te.embedding_type = 'identity'
          AND se.embedding IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM seeds s
            WHERE s.track_id = te.track_id AND s.friend_id = te.friend_id
          )
        ORDER BY te.embedding <=> se.embedding
        LIMIT $${limitParamIndex}
        `,
        [...queryParams, params.limit]
      );

      return normalizeRows(result.rows);
    });
  }

  async findAudioSimilarByCentroid(params: {
    seedTracks: SeedTrackPair[];
    limit: number;
    ivfflatProbes: number;
  }): Promise<RecommendationCandidateRow[]> {
    if (params.seedTracks.length === 0) return [];

    return withDbClient(async (client) => {
      await client.query("SELECT set_config('ivfflat.probes', $1, false)", [
        String(params.ivfflatProbes),
      ]);

      const { valuesClause, params: queryParams, limitParamIndex } = buildSeedValues(
        params.seedTracks
      );

      const result = await client.query<RecommendationCandidateRowRaw>(
        `
        WITH seeds(track_id, friend_id) AS (
          VALUES ${valuesClause}
        ),
        seed_embedding AS (
          SELECT AVG(te.embedding) AS embedding
          FROM track_embeddings te
          JOIN seeds s
            ON te.track_id = s.track_id
           AND te.friend_id = s.friend_id
          WHERE te.embedding_type = 'audio_vibe'
        )
        SELECT
          t.track_id,
          t.friend_id,
          t.title,
          t.artist,
          t.album,
          t.year,
          t.bpm,
          t.key,
          t.genres,
          t.styles,
          t.local_tags,
          t.danceability,
          t.mood_happy,
          t.mood_sad,
          t.mood_relaxed,
          t.mood_aggressive,
          t.star_rating,
          te.embedding <=> se.embedding AS distance
        FROM track_embeddings te
        JOIN tracks t ON te.track_id = t.track_id AND te.friend_id = t.friend_id
        CROSS JOIN seed_embedding se
        WHERE te.embedding_type = 'audio_vibe'
          AND se.embedding IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM seeds s
            WHERE s.track_id = te.track_id AND s.friend_id = te.friend_id
          )
        ORDER BY te.embedding <=> se.embedding
        LIMIT $${limitParamIndex}
        `,
        [...queryParams, params.limit]
      );

      return normalizeRows(result.rows);
    });
  }
}

export const recommendationRepository = new RecommendationRepository();
