/**
 * Find tracks with similar identity embeddings
 * GET /api/embeddings/similar?track_id=...&friend_id=...&limit=50&era=...&country=...&tags=...
 *
 * Query params:
 * - track_id: string (required)
 * - friend_id: number (required)
 * - limit: number (optional, default 50)
 * - era: string (optional, filter by era bucket e.g. "1990s")
 * - country: string (optional, filter by country)
 * - tags: string (optional, comma-separated, must have any of these tags)
 * - ivfflat_probes: number (optional, default 10, tune for accuracy/speed tradeoff)
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface SimilarTrack {
  track_id: string;
  friend_id: number;
  title: string;
  artist: string;
  album: string;
  year: string | number;
  genres: string[];
  styles: string[];
  local_tags: string;
  album_thumbnail?: string;
  audio_file_album_art_url?: string;
  bpm?: string;
  key?: string;
  star_rating?: number;
  duration_seconds?: number;
  position?: string;
  discogs_url?: string;
  apple_music_url?: string;
  spotify_url?: string;
  youtube_url?: string;
  local_audio_url?: string;
  distance: number;
  identity_text: string;
}

interface SimilarityFilters {
  era?: string;
  country?: string;
  tags?: string[];
}

/**
 * Build WHERE clause for filters
 */
function buildFilterClause(filters: SimilarityFilters): {
  clause: string;
  params: any[];
} {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.era) {
    // Era filtering requires joining with albums or parsing year from tracks
    // For now, we'll filter in the outer query
  }

  if (filters.country) {
    conditions.push(`a.country = $${paramIndex}`);
    params.push(filters.country);
    paramIndex++;
  }

  if (filters.tags && filters.tags.length > 0) {
    // Match any tag (OR condition)
    // Convert tags array to lowercase for case-insensitive matching
    const tagPatterns = filters.tags.map((tag) => `%${tag.toLowerCase()}%`);
    const tagConditions = tagPatterns.map((_, i) => {
      const idx = paramIndex + i;
      return `LOWER(t.local_tags) LIKE $${idx}`;
    });
    conditions.push(`(${tagConditions.join(" OR ")})`);
    params.push(...tagPatterns);
    paramIndex += tagPatterns.length;
  }

  return {
    clause: conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "",
    params,
  };
}

/**
 * Apply era filter in-memory (since era is computed from year)
 */
function applyEraFilter(tracks: SimilarTrack[], era?: string): SimilarTrack[] {
  if (!era) return tracks;

  return tracks.filter((track) => {
    const year = track.year;
    if (!year) return era === "unknown-era";

    const yearNum = typeof year === "string" ? parseInt(year, 10) : year;
    if (isNaN(yearNum) || yearNum < 1900) return era === "unknown-era";

    if (era === "2020s") return yearNum >= 2020;
    if (era === "2010s") return yearNum >= 2010 && yearNum < 2020;
    if (era === "2000s") return yearNum >= 2000 && yearNum < 2010;
    if (era === "1990s") return yearNum >= 1990 && yearNum < 2000;
    if (era === "1980s") return yearNum >= 1980 && yearNum < 1990;
    if (era === "1970s") return yearNum >= 1970 && yearNum < 1980;
    if (era === "1960s") return yearNum >= 1960 && yearNum < 1970;
    if (era === "1950s") return yearNum >= 1950 && yearNum < 1960;
    if (era === "pre-1950s") return yearNum < 1950;

    return false;
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const track_id = searchParams.get("track_id");
    const friend_id = searchParams.get("friend_id");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const ivfflat_probes = parseInt(
      searchParams.get("ivfflat_probes") || "10",
      10
    );

    if (!track_id || !friend_id) {
      return NextResponse.json(
        { error: "Missing track_id or friend_id" },
        { status: 400 }
      );
    }

    const friendIdNum = parseInt(friend_id, 10);
    if (isNaN(friendIdNum)) {
      return NextResponse.json({ error: "Invalid friend_id" }, { status: 400 });
    }

    // Parse filters
    const filters: SimilarityFilters = {
      era: searchParams.get("era") || undefined,
      country: searchParams.get("country") || undefined,
      tags: searchParams.get("tags")
        ? searchParams
            .get("tags")!
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
    };

    // Set ivfflat probes for this session (higher = more accurate but slower)
    await pool.query(`SET ivfflat.probes = ${ivfflat_probes}`);

    // Get source embedding
    const sourceResult = await pool.query(
      `
      SELECT embedding
      FROM track_embeddings
      WHERE track_id = $1 AND friend_id = $2 AND embedding_type = 'identity'
    `,
      [track_id, friendIdNum]
    );

    if (sourceResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Track has no identity embedding. Run backfill first." },
        { status: 404 }
      );
    }

    const sourceEmbedding = sourceResult.rows[0].embedding;

    // Build filter clause
    const { clause: filterClause, params: filterParams } =
      buildFilterClause(filters);

    // Query similar tracks
    // Use cosine distance (<=> operator)
    const query = `
      SELECT
        t.track_id,
        t.friend_id,
        t.title,
        t.artist,
        t.album,
        t.year,
        t.genres,
        t.styles,
        t.local_tags,
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
        ${filterClause}
      ORDER BY te.embedding <=> $1
      LIMIT $${filterParams.length + 4}
    `;

    const queryParams = [sourceEmbedding, track_id, friendIdNum, ...filterParams, limit * 2]; // Fetch 2x limit for era filtering

    const result = await pool.query(query, queryParams);

    let tracks: SimilarTrack[] = result.rows.map((row) => ({
      track_id: row.track_id,
      friend_id: row.friend_id,
      title: row.title,
      artist: row.artist,
      album: row.album,
      year: row.year,
      genres: row.genres || [],
      styles: row.styles || [],
      local_tags: row.local_tags || "",
      album_thumbnail: row.album_thumbnail,
      audio_file_album_art_url: row.audio_file_album_art_url,
      bpm: row.bpm,
      key: row.key,
      star_rating: row.star_rating,
      duration_seconds: row.duration_seconds,
      position: row.position,
      discogs_url: row.discogs_url,
      apple_music_url: row.apple_music_url,
      spotify_url: row.spotify_url,
      youtube_url: row.youtube_url,
      local_audio_url: row.local_audio_url,
      distance: parseFloat(row.distance),
      identity_text: row.identity_text,
    }));

    // Apply era filter (in-memory since it's computed)
    tracks = applyEraFilter(tracks, filters.era);

    // Trim to limit
    tracks = tracks.slice(0, limit);

    return NextResponse.json({
      source_track_id: track_id,
      source_friend_id: friendIdNum,
      filters,
      count: tracks.length,
      tracks,
    });
  } catch (error) {
    console.error("[Similar Tracks] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to find similar tracks",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
