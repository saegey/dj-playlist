/**
 * Music identity embedding service.
 * Generates deterministic, normalized embeddings for track identity.
 */

import OpenAI from "openai";
import { Pool } from "pg";
import crypto from "crypto";
import {
  normalizeList,
  formatList,
  yearToEra,
  normalizeCountry,
  normalizeLabels,
  combineGenres,
  normalizeStyles,
  normalizeLocalTags,
} from "./identity-normalization";
import { Track } from "@/types/track";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "My API Key",
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Extended track data with album metadata
 */
interface TrackWithAlbum extends Track {
  album_country?: string | null;
  album_label?: string | null;
  album_genres?: string[] | null;
  album_styles?: string[] | null;
}

/**
 * Normalized identity data for embedding
 */
interface IdentityData {
  title: string;
  artist: string;
  album: string;
  era: string;
  country: string;
  labels: string[];
  genres: string[];
  styles: string[];
  tags: string[];
}

/**
 * Fetch track with album metadata (country, label, etc.)
 */
export async function fetchTrackWithAlbum(
  track_id: string,
  friend_id: number
): Promise<TrackWithAlbum | null> {
  const query = `
    SELECT
      t.*,
      a.country AS album_country,
      a.label AS album_label,
      a.genres AS album_genres,
      a.styles AS album_styles
    FROM tracks t
    LEFT JOIN albums a ON t.release_id = a.release_id AND t.friend_id = a.friend_id
    WHERE t.track_id = $1 AND t.friend_id = $2
  `;

  const result = await pool.query(query, [track_id, friend_id]);
  return result.rows[0] || null;
}

/**
 * Build normalized identity data from track
 */
export function buildIdentityData(track: TrackWithAlbum): IdentityData {
  // Normalize basic fields
  const title = (track.title || "unknown").trim();
  const artist = (track.artist || "unknown").trim();
  const album = (track.album || "unknown").trim();

  // Era bucketing
  const era = yearToEra(track.year);

  // Country from album or fallback
  const country = normalizeCountry(track.album_country);

  // Labels (from album, parse if string)
  const labelString = track.album_label || "";
  const labels = normalizeLabels(labelString ? labelString.split(",") : []);

  // Genres: prefer Discogs (album or track), fallback to track genres
  const genres = combineGenres(
    track.album_genres || track.genres,
    null, // No separate Apple genre field in Track type
    8
  );

  // Styles: prefer album styles, fallback to track styles
  const styleSource = track.album_styles || track.styles;
  const styles = normalizeStyles(styleSource, 12);

  // Local tags: filter out DJ-function tags
  const tags = normalizeLocalTags(track.local_tags, 12);

  return {
    title,
    artist,
    album,
    era,
    country,
    labels,
    genres,
    styles,
    tags,
  };
}

/**
 * Build identity embedding text from normalized data
 * Uses a strict template for stability
 */
export function buildIdentityText(data: IdentityData): string {
  const lines = [
    `Track: ${data.title} — ${data.artist}`,
    `Release: ${data.album} (${data.era})`,
    `Country: ${data.country}`,
    `Labels: ${data.labels.length > 0 ? formatList(data.labels) : "none"}`,
    `Genres: ${data.genres.length > 0 ? formatList(data.genres) : "unknown"}`,
    `Styles: ${data.styles.length > 0 ? formatList(data.styles) : "unknown"}`,
    `Tags: ${data.tags.length > 0 ? formatList(data.tags) : "none"}`,
  ];

  return lines.join("\n");
}

/**
 * Compute SHA256 hash of identity data for change detection
 */
export function computeSourceHash(data: IdentityData): string {
  // Create a stable, sorted representation
  const canonical = JSON.stringify(
    {
      title: data.title,
      artist: data.artist,
      album: data.album,
      era: data.era,
      country: data.country,
      labels: data.labels.sort(),
      genres: data.genres.sort(),
      styles: data.styles.sort(),
      tags: data.tags.sort(),
    },
    null,
    0
  );

  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

/**
 * Generate OpenAI embedding for identity text
 */
export async function generateIdentityEmbedding(
  identityText: string
): Promise<number[]> {
  console.log("Generating identity embedding for:\n", identityText);

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: identityText,
  });

  return response.data[0].embedding;
}

/**
 * Store identity embedding in database
 */
export async function storeIdentityEmbedding(
  track_id: string,
  friend_id: number,
  embedding: number[],
  sourceHash: string,
  identityText: string,
  model = "text-embedding-3-small",
  dims = 1536
): Promise<void> {
  const pgVector = `[${embedding.join(",")}]`;

  await pool.query(
    `
    INSERT INTO track_embeddings (
      track_id, friend_id, embedding_type, model, dims, embedding, source_hash, identity_text, updated_at
    )
    VALUES ($1, $2, 'identity', $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    ON CONFLICT (track_id, friend_id, embedding_type)
    DO UPDATE SET
      embedding = EXCLUDED.embedding,
      source_hash = EXCLUDED.source_hash,
      identity_text = EXCLUDED.identity_text,
      model = EXCLUDED.model,
      dims = EXCLUDED.dims,
      updated_at = CURRENT_TIMESTAMP
  `,
    [track_id, friend_id, model, dims, pgVector, sourceHash, identityText]
  );
}

/**
 * Check if embedding needs update (source hash changed)
 */
export async function needsEmbeddingUpdate(
  track_id: string,
  friend_id: number,
  newSourceHash: string
): Promise<boolean> {
  const result = await pool.query(
    `
    SELECT source_hash
    FROM track_embeddings
    WHERE track_id = $1 AND friend_id = $2 AND embedding_type = 'identity'
  `,
    [track_id, friend_id]
  );

  if (result.rows.length === 0) {
    return true; // No embedding exists
  }

  return result.rows[0].source_hash !== newSourceHash;
}

/**
 * Generate and store identity embedding for a track (main entry point)
 */
export async function generateAndStoreIdentityEmbedding(
  track_id: string,
  friend_id: number,
  forceUpdate = false
): Promise<{ updated: boolean; reason: string }> {
  // Fetch track with album data
  const track = await fetchTrackWithAlbum(track_id, friend_id);
  if (!track) {
    throw new Error(`Track not found: ${track_id} (friend_id: ${friend_id})`);
  }

  // Build identity data
  const identityData = buildIdentityData(track);
  const sourceHash = computeSourceHash(identityData);

  // Check if update needed
  if (!forceUpdate) {
    const needsUpdate = await needsEmbeddingUpdate(track_id, friend_id, sourceHash);
    if (!needsUpdate) {
      return { updated: false, reason: "Source hash unchanged" };
    }
  }

  // Generate embedding
  const identityText = buildIdentityText(identityData);
  const embedding = await generateIdentityEmbedding(identityText);

  // Store in database
  await storeIdentityEmbedding(
    track_id,
    friend_id,
    embedding,
    sourceHash,
    identityText
  );

  return { updated: true, reason: "Embedding generated and stored" };
}

/**
 * Get identity embedding preview (for debugging/testing)
 */
export async function getIdentityPreview(
  track_id: string,
  friend_id: number
): Promise<{ identityText: string; identityData: IdentityData }> {
  const track = await fetchTrackWithAlbum(track_id, friend_id);
  if (!track) {
    throw new Error(`Track not found: ${track_id} (friend_id: ${friend_id})`);
  }

  const identityData = buildIdentityData(track);
  const identityText = buildIdentityText(identityData);

  return { identityText, identityData };
}
