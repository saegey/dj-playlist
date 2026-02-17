/**
 * Find tracks with similar audio vibe embeddings
 * GET /api/embeddings/similar-vibe?track_id=...&friend_id=...&limit=50
 *
 * Query params:
 * - track_id: string (required)
 * - friend_id: number (required)
 * - limit: number (optional, default 50)
 * - ivfflat_probes: number (optional, default 10, tune for accuracy/speed tradeoff)
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface SimilarVibeTrack {
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
  danceability?: string;
  mood_happy?: number;
  mood_sad?: number;
  mood_relaxed?: number;
  mood_aggressive?: number;
  distance: number;
  identity_text: string;
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

    // Set ivfflat probes for this session (higher = more accurate but slower)
    await pool.query(`SET ivfflat.probes = ${ivfflat_probes}`);

    // Get source embedding
    const sourceResult = await pool.query(
      `
      SELECT embedding
      FROM track_embeddings
      WHERE track_id = $1 AND friend_id = $2 AND embedding_type = 'audio_vibe'
    `,
      [track_id, friendIdNum]
    );

    if (sourceResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Track has no audio vibe embedding. Run backfill first." },
        { status: 404 }
      );
    }

    const sourceEmbedding = sourceResult.rows[0].embedding;

    // Query similar tracks by audio vibe
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
    `;

    const queryParams = [sourceEmbedding, track_id, friendIdNum, limit];

    const result = await pool.query(query, queryParams);

    const tracks: SimilarVibeTrack[] = result.rows.map((row) => ({
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
      danceability: row.danceability,
      mood_happy: row.mood_happy,
      mood_sad: row.mood_sad,
      mood_relaxed: row.mood_relaxed,
      mood_aggressive: row.mood_aggressive,
      distance: parseFloat(row.distance),
      identity_text: row.identity_text,
    }));

    return NextResponse.json({
      source_track_id: track_id,
      source_friend_id: friendIdNum,
      count: tracks.length,
      tracks,
    });
  } catch (error) {
    console.error("[Similar Vibe Tracks] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to find similar vibe tracks",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
