import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { MeiliSearch } from 'meilisearch';
import { generateLocalReleaseId, generateLocalTrackId } from '@/lib/localTrackHelpers';
import { saveAlbumCover } from '@/lib/fileUpload';
import { AlbumToUpsert, upsertAlbum } from '@/services/albumUpsertService';
import { addTracksToMeili } from '@/services/meiliDocumentService';
import { addAlbumsToMeili } from '@/services/albumMeiliService';
import { Track } from '@/types/track';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const meiliClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY,
});

interface AlbumMetadata {
  title: string;
  artist: string;
  year?: string;
  genres?: string[];
  styles?: string[];
  album_notes?: string;
  album_rating?: number;
  purchase_price?: number;
  condition?: string;
  label?: string;
  catalog_number?: string;
  country?: string;
  format?: string;
  library_identifier?: string;
}

interface TrackMetadata {
  title: string;
  artist: string;
  position?: string;
  duration_seconds?: number;
  bpm?: number;
  key?: string;
  notes?: string;
  local_tags?: string;
  star_rating?: number;
  apple_music_url?: string;
  spotify_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
}

export async function POST(request: NextRequest) {
  let client;
  try {
    const formData = await request.formData();

    // Parse JSON fields
    const albumJson = formData.get('album') as string;
    const tracksJson = formData.get('tracks') as string;
    const friendIdStr = formData.get('friend_id') as string;
    const coverArtFile = formData.get('cover_art') as File | null;

    if (!albumJson || !tracksJson || !friendIdStr) {
      return NextResponse.json(
        { error: 'Missing required fields: album, tracks, friend_id' },
        { status: 400 }
      );
    }

    const album: AlbumMetadata = JSON.parse(albumJson);
    const tracks: TrackMetadata[] = JSON.parse(tracksJson);
    const friendId = parseInt(friendIdStr, 10);

    // Validate required fields
    if (!album.title || !album.artist) {
      return NextResponse.json(
        { error: 'Album title and artist are required' },
        { status: 400 }
      );
    }

    if (!tracks.length) {
      return NextResponse.json(
        { error: 'At least one track is required' },
        { status: 400 }
      );
    }

    if (isNaN(friendId)) {
      return NextResponse.json(
        { error: 'Invalid friend_id' },
        { status: 400 }
      );
    }

    for (const track of tracks) {
      if (!track.title || !track.artist) {
        return NextResponse.json(
          { error: 'All tracks must have title and artist' },
          { status: 400 }
        );
      }
    }

    // Generate release_id
    const releaseId = generateLocalReleaseId();

    // Handle cover art upload if provided
    let albumThumbnail: string | undefined;
    if (coverArtFile && coverArtFile.size > 0) {
      try {
        albumThumbnail = await saveAlbumCover(coverArtFile);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to upload cover art' },
          { status: 413 }
        );
      }
    }

    // Get friend username for tracks
    client = await pool.connect();
    const friendResult = await client.query(
      'SELECT username FROM friends WHERE id = $1',
      [friendId]
    );

    if (friendResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Friend not found' },
        { status: 404 }
      );
    }

    const username = friendResult.rows[0].username;

    // Start transaction
    await client.query('BEGIN');

    try {
      // Insert album
      const now = new Date().toISOString();
      const albumToUpsert: AlbumToUpsert = {
        release_id: releaseId,
        friend_id: friendId,
        title: album.title,
        artist: album.artist,
        year: album.year,
        genres: album.genres || [],
        styles: album.styles || [],
        album_thumbnail: albumThumbnail,
        track_count: tracks.length,
        label: album.label,
        catalog_number: album.catalog_number,
        country: album.country,
        format: album.format,
        date_added: now,
        date_changed: now,
      };

      const createdAlbum = await upsertAlbum(client as unknown as Pool, albumToUpsert);

      // Insert tracks
      const createdTracks: Track[] = [];
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const trackId = generateLocalTrackId();
        const position = track.position ?? `${i + 1}`;

        const trackResult = await client.query(
          `INSERT INTO tracks (
            track_id, friend_id, username, title, artist, album, year,
            styles, genres, duration, duration_seconds, position,
            discogs_url, apple_music_url, spotify_url, youtube_url, soundcloud_url,
            album_thumbnail, local_tags, bpm, key, notes, star_rating, release_id,
            library_identifier
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
          RETURNING *`,
          [
            trackId,
            friendId,
            username,
            track.title,
            track.artist,
            album.title, // Use album title
            album.year || '',
            album.styles || [],
            album.genres || [],
            track.duration_seconds ? `${Math.floor(track.duration_seconds / 60)}:${String(track.duration_seconds % 60).padStart(2, '0')}` : '0:00',
            track.duration_seconds || 0,
            position,
            '', // discogs_url empty for local tracks
            track.apple_music_url || '',
            track.spotify_url || '',
            track.youtube_url || '',
            track.soundcloud_url || '',
            albumThumbnail || '',
            track.local_tags || '',
            track.bpm || null,
            track.key || null,
            track.notes || '',
            track.star_rating || 0,
            releaseId,
            album.library_identifier || null,
          ]
        );

        createdTracks.push(trackResult.rows[0]);
      }

      // Commit transaction
      await client.query('COMMIT');

      // Index in MeiliSearch (async, don't block response)
      const tracksIndex = meiliClient.index('tracks');
      const albumsIndex = meiliClient.index('albums');

      // Index tracks
      addTracksToMeili(tracksIndex, createdTracks as never[]).catch((err) => {
        console.error('Failed to index tracks in MeiliSearch:', err);
      });

      // Index album (using proper helper that adds composite id)
      addAlbumsToMeili(albumsIndex, [createdAlbum]).catch((err) => {
        console.error('Failed to index album in MeiliSearch:', err);
      });

      return NextResponse.json({
        album: createdAlbum,
        tracks: createdTracks,
      });

    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create album' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
