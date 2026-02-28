/**
 * Recommendation Candidate Retriever - Phase 1
 *
 * Retrieves candidate tracks from multiple embedding indexes (identity, audio_vibe)
 * and unions them into a deduplicated candidate set with similarity scores preserved.
 *
 * This is Phase 1 of the multi-vector recommendation system.
 * Reranking and scoring will be implemented in Phase 2.
 */

import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Options for candidate retrieval
 */
export interface RetrieveCandidatesOptions {
  /** Limit for identity similarity query (default: 200) */
  limitIdentity?: number;

  /** Limit for audio vibe similarity query (default: 200) */
  limitAudio?: number;

  /** Optional filters (not implemented in Phase 1) */
  filters?: {
    minBpm?: number;
    maxBpm?: number;
    keys?: string[];
    minRating?: number;
    // Add more filters as needed
  };

  /** IVFFlat probes for accuracy/speed tradeoff (default: 10) */
  ivfflatProbes?: number;
}

export interface SeedTrackRef {
  trackId: string;
  friendId: number;
}

/**
 * Candidate track with similarity scores and metadata
 */
export interface CandidateTrack {
  trackId: string;
  friendId: number;

  /** Identity similarity [0..1], null if not in identity results */
  simIdentity: number | null;

  /** Audio vibe similarity [0..1], null if not in audio results */
  simAudio: number | null;

  /** Track metadata for reranking */
  metadata: {
    bpm: number | null;
    key: string | null;
    keyConfidence: number | null;
    tempoConfidence: number | null;
    eraBucket: string | null;
    tags: string[];
    styles: string[];
    energy: number | null;
    danceability: number | null;

    // Additional useful fields
    title: string;
    artist: string;
    album: string;
    year: string | null;
    genres: string[];
    starRating: number | null;

    // Mood scores
    moodHappy: number | null;
    moodSad: number | null;
    moodRelaxed: number | null;
    moodAggressive: number | null;
  };
}

/**
 * Result of candidate retrieval
 */
export interface RetrieveCandidatesResult {
  seedTrackId: string;
  seedFriendId: number;
  candidates: CandidateTrack[];
  stats: {
    identityCount: number;
    audioCount: number;
    unionCount: number;
    timingMs: {
      identityQuery: number;
      audioQuery: number;
      total: number;
    };
  };
}

/**
 * Internal: Result from a single embedding query
 */
interface EmbeddingQueryResult {
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
}

/**
 * Convert cosine distance [0..2] to similarity [0..1]
 * pgvector cosine distance: 0 = identical, 2 = opposite
 * similarity: 1 = identical, 0 = opposite
 */
function distanceToSimilarity(distance: number): number {
  return 1 - (distance / 2);
}

/**
 * Compute era bucket from year
 */
function computeEraBucket(year: string | null): string | null {
  if (!year) return null;

  const yearNum = parseInt(year, 10);
  if (isNaN(yearNum) || yearNum < 1900) return null;

  if (yearNum >= 2020) return "2020s";
  if (yearNum >= 2010) return "2010s";
  if (yearNum >= 2000) return "2000s";
  if (yearNum >= 1990) return "1990s";
  if (yearNum >= 1980) return "1980s";
  if (yearNum >= 1970) return "1970s";
  if (yearNum >= 1960) return "1960s";
  if (yearNum >= 1950) return "1950s";
  return "pre-1950s";
}

/**
 * Calculate energy from danceability and aggressive mood
 */
function calculateEnergy(danceability: number | null, moodAggressive: number | null): number | null {
  if (danceability === null && moodAggressive === null) return null;

  const dance = danceability ?? 0.5;
  const aggression = moodAggressive ?? 0.5;

  // Simple energy calculation (can be refined)
  return (dance * 0.6 + aggression * 0.4);
}

/**
 * Parse tags from comma-separated string
 */
function parseTags(localTags: string): string[] {
  if (!localTags) return [];
  return localTags.split(",").map(tag => tag.trim()).filter(Boolean);
}

/**
 * Query similar tracks by identity embedding
 */
async function queryIdentitySimilar(
  seedTrackId: string,
  seedFriendId: number,
  limit: number,
  ivfflatProbes: number
): Promise<EmbeddingQueryResult[]> {
  // Set ivfflat probes for this query
  await pool.query(`SET ivfflat.probes = ${ivfflatProbes}`);

  // Get seed embedding
  const embeddingResult = await pool.query(
    `SELECT embedding FROM track_embeddings
     WHERE track_id = $1 AND friend_id = $2 AND embedding_type = 'identity'`,
    [seedTrackId, seedFriendId]
  );

  if (embeddingResult.rows.length === 0) {
    console.warn(`[RecommendationCandidateRetriever] No identity embedding for seed track ${seedTrackId}`);
    return [];
  }

  const seedEmbedding = embeddingResult.rows[0].embedding;

  // Query similar tracks
  const query = `
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
  `;

  const result = await pool.query(query, [seedEmbedding, seedTrackId, seedFriendId, limit]);
  return result.rows;
}

function buildSeedValues(seedTracks: SeedTrackRef[]): {
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

async function queryIdentitySimilarByCentroid(
  seedTracks: SeedTrackRef[],
  limit: number,
  ivfflatProbes: number
): Promise<EmbeddingQueryResult[]> {
  await pool.query(`SET ivfflat.probes = ${ivfflatProbes}`);

  const { valuesClause, params, limitParamIndex } = buildSeedValues(seedTracks);
  const query = `
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
  `;

  const result = await pool.query(query, [...params, limit]);
  return result.rows;
}

/**
 * Query similar tracks by audio vibe embedding
 */
async function queryAudioSimilar(
  seedTrackId: string,
  seedFriendId: number,
  limit: number,
  ivfflatProbes: number
): Promise<EmbeddingQueryResult[]> {
  // Set ivfflat probes for this query
  await pool.query(`SET ivfflat.probes = ${ivfflatProbes}`);

  // Get seed embedding
  const embeddingResult = await pool.query(
    `SELECT embedding FROM track_embeddings
     WHERE track_id = $1 AND friend_id = $2 AND embedding_type = 'audio_vibe'`,
    [seedTrackId, seedFriendId]
  );

  if (embeddingResult.rows.length === 0) {
    console.warn(`[RecommendationCandidateRetriever] No audio_vibe embedding for seed track ${seedTrackId}`);
    return [];
  }

  const seedEmbedding = embeddingResult.rows[0].embedding;

  // Query similar tracks
  const query = `
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
  `;

  const result = await pool.query(query, [seedEmbedding, seedTrackId, seedFriendId, limit]);
  return result.rows;
}

async function queryAudioSimilarByCentroid(
  seedTracks: SeedTrackRef[],
  limit: number,
  ivfflatProbes: number
): Promise<EmbeddingQueryResult[]> {
  await pool.query(`SET ivfflat.probes = ${ivfflatProbes}`);

  const { valuesClause, params, limitParamIndex } = buildSeedValues(seedTracks);
  const query = `
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
  `;

  const result = await pool.query(query, [...params, limit]);
  return result.rows;
}

/**
 * Convert query result to candidate track metadata
 */
function buildCandidateMetadata(row: EmbeddingQueryResult) {
  return {
    bpm: row.bpm,
    key: row.key,
    keyConfidence: null, // Not available in current schema
    tempoConfidence: null, // Not available in current schema
    eraBucket: computeEraBucket(row.year),
    tags: parseTags(row.local_tags),
    styles: row.styles || [],
    energy: calculateEnergy(row.danceability, row.mood_aggressive),
    danceability: row.danceability,
    title: row.title,
    artist: row.artist,
    album: row.album,
    year: row.year,
    genres: row.genres || [],
    starRating: row.star_rating,
    moodHappy: row.mood_happy,
    moodSad: row.mood_sad,
    moodRelaxed: row.mood_relaxed,
    moodAggressive: row.mood_aggressive,
  };
}

/**
 * Retrieve candidate tracks from multiple embedding indexes
 *
 * @param seedTrackId - The track ID to find recommendations for
 * @param seedFriendId - The friend ID of the seed track
 * @param options - Retrieval options (limits, filters, etc.)
 * @returns Deduplicated union of candidates with similarity scores
 */
export async function retrieveCandidates(
  seedTrackId: string,
  seedFriendId: number,
  options: RetrieveCandidatesOptions = {}
): Promise<RetrieveCandidatesResult> {
  const startTime = Date.now();

  const {
    limitIdentity = 200,
    limitAudio = 200,
    ivfflatProbes = 10,
  } = options;

  console.log(`[RecommendationCandidateRetriever] Retrieving candidates for track ${seedTrackId}`);
  console.log(`[RecommendationCandidateRetriever] Options:`, { limitIdentity, limitAudio, ivfflatProbes });

  // Query identity similar tracks
  const identityStartTime = Date.now();
  const identityResults = await queryIdentitySimilar(
    seedTrackId,
    seedFriendId,
    limitIdentity,
    ivfflatProbes
  );
  const identityTime = Date.now() - identityStartTime;
  console.log(`[RecommendationCandidateRetriever] Identity query returned ${identityResults.length} tracks in ${identityTime}ms`);

  // Query audio vibe similar tracks
  const audioStartTime = Date.now();
  const audioResults = await queryAudioSimilar(
    seedTrackId,
    seedFriendId,
    limitAudio,
    ivfflatProbes
  );
  const audioTime = Date.now() - audioStartTime;
  console.log(`[RecommendationCandidateRetriever] Audio query returned ${audioResults.length} tracks in ${audioTime}ms`);

  // Build union with deduplication
  // Use Map to track unique tracks by composite key
  const candidateMap = new Map<string, CandidateTrack>();

  // Add identity results
  for (const row of identityResults) {
    const key = `${row.track_id}:${row.friend_id}`;
    candidateMap.set(key, {
      trackId: row.track_id,
      friendId: row.friend_id,
      simIdentity: distanceToSimilarity(row.distance),
      simAudio: null, // Will be filled if also in audio results
      metadata: buildCandidateMetadata(row),
    });
  }

  // Merge audio results
  for (const row of audioResults) {
    const key = `${row.track_id}:${row.friend_id}`;
    const existing = candidateMap.get(key);

    if (existing) {
      // Track is in both results - add audio similarity
      existing.simAudio = distanceToSimilarity(row.distance);
    } else {
      // Track only in audio results
      candidateMap.set(key, {
        trackId: row.track_id,
        friendId: row.friend_id,
        simIdentity: null,
        simAudio: distanceToSimilarity(row.distance),
        metadata: buildCandidateMetadata(row),
      });
    }
  }

  const candidates = Array.from(candidateMap.values());
  const totalTime = Date.now() - startTime;

  console.log(`[RecommendationCandidateRetriever] Union produced ${candidates.length} unique candidates`);
  console.log(`[RecommendationCandidateRetriever] Total time: ${totalTime}ms`);

  return {
    seedTrackId,
    seedFriendId,
    candidates,
    stats: {
      identityCount: identityResults.length,
      audioCount: audioResults.length,
      unionCount: candidates.length,
      timingMs: {
        identityQuery: identityTime,
        audioQuery: audioTime,
        total: totalTime,
      },
    },
  };
}

export async function retrieveCandidatesForSeedTracks(
  seedTracks: SeedTrackRef[],
  options: RetrieveCandidatesOptions = {}
): Promise<RetrieveCandidatesResult> {
  if (!Array.isArray(seedTracks) || seedTracks.length === 0) {
    throw new Error("At least one seed track is required");
  }

  const dedupedSeedTracks = Array.from(
    new Map(
      seedTracks
        .filter((seed) => seed.trackId && Number.isFinite(seed.friendId))
        .map((seed) => [`${seed.trackId}:${seed.friendId}`, seed] as const)
    ).values()
  );

  if (dedupedSeedTracks.length === 0) {
    throw new Error("No valid seed tracks provided");
  }

  const startTime = Date.now();
  const { limitIdentity = 200, limitAudio = 200, ivfflatProbes = 10 } = options;

  const identityStartTime = Date.now();
  const identityResults = await queryIdentitySimilarByCentroid(
    dedupedSeedTracks,
    limitIdentity,
    ivfflatProbes
  );
  const identityTime = Date.now() - identityStartTime;

  const audioStartTime = Date.now();
  const audioResults = await queryAudioSimilarByCentroid(
    dedupedSeedTracks,
    limitAudio,
    ivfflatProbes
  );
  const audioTime = Date.now() - audioStartTime;

  const candidateMap = new Map<string, CandidateTrack>();

  for (const row of identityResults) {
    const key = `${row.track_id}:${row.friend_id}`;
    candidateMap.set(key, {
      trackId: row.track_id,
      friendId: row.friend_id,
      simIdentity: distanceToSimilarity(row.distance),
      simAudio: null,
      metadata: buildCandidateMetadata(row),
    });
  }

  for (const row of audioResults) {
    const key = `${row.track_id}:${row.friend_id}`;
    const existing = candidateMap.get(key);
    if (existing) {
      existing.simAudio = distanceToSimilarity(row.distance);
    } else {
      candidateMap.set(key, {
        trackId: row.track_id,
        friendId: row.friend_id,
        simIdentity: null,
        simAudio: distanceToSimilarity(row.distance),
        metadata: buildCandidateMetadata(row),
      });
    }
  }

  const totalTime = Date.now() - startTime;
  const seed0 = dedupedSeedTracks[0];

  return {
    seedTrackId: seed0.trackId,
    seedFriendId: seed0.friendId,
    candidates: Array.from(candidateMap.values()),
    stats: {
      identityCount: identityResults.length,
      audioCount: audioResults.length,
      unionCount: candidateMap.size,
      timingMs: {
        identityQuery: identityTime,
        audioQuery: audioTime,
        total: totalTime,
      },
    },
  };
}

/**
 * Helper: Check if a track has embeddings
 */
export async function hasEmbeddings(
  trackId: string,
  friendId: number
): Promise<{ identity: boolean; audio: boolean }> {
  const result = await pool.query(
    `SELECT embedding_type FROM track_embeddings
     WHERE track_id = $1 AND friend_id = $2`,
    [trackId, friendId]
  );

  const types = new Set(result.rows.map(r => r.embedding_type));

  return {
    identity: types.has('identity'),
    audio: types.has('audio_vibe'),
  };
}

export async function hasEmbeddingsForSeedTracks(
  seedTracks: SeedTrackRef[]
): Promise<{ identity: boolean; audio: boolean }> {
  const dedupedSeedTracks = Array.from(
    new Map(
      seedTracks
        .filter((seed) => seed.trackId && Number.isFinite(seed.friendId))
        .map((seed) => [`${seed.trackId}:${seed.friendId}`, seed] as const)
    ).values()
  );

  if (dedupedSeedTracks.length === 0) {
    return { identity: false, audio: false };
  }

  const { valuesClause, params } = buildSeedValues(dedupedSeedTracks);
  const query = `
    WITH seeds(track_id, friend_id) AS (
      VALUES ${valuesClause}
    )
    SELECT DISTINCT te.embedding_type
    FROM track_embeddings te
    JOIN seeds s
      ON te.track_id = s.track_id
     AND te.friend_id = s.friend_id
  `;
  const result = await pool.query(query, params);
  const types = new Set(result.rows.map((row) => row.embedding_type));
  return {
    identity: types.has("identity"),
    audio: types.has("audio_vibe"),
  };
}
