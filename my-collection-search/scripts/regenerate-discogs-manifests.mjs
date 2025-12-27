#!/usr/bin/env node

/**
 * Regenerate Discogs manifest and release files from database
 * This is useful when you have tracks in the database but missing the physical export files
 *
 * Usage:
 *   node scripts/regenerate-discogs-manifests.mjs
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DISCOGS_EXPORTS_DIR = path.resolve(__dirname, '..', 'discogs_exports');

async function regenerateManifests() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Starting Discogs manifest regeneration...\n');

    // Create exports directory if it doesn't exist
    if (!fs.existsSync(DISCOGS_EXPORTS_DIR)) {
      fs.mkdirSync(DISCOGS_EXPORTS_DIR, { recursive: true });
      console.log(`✅ Created directory: ${DISCOGS_EXPORTS_DIR}\n`);
    }

    // Get all friends (users)
    const friendsResult = await pool.query('SELECT id, username FROM friends ORDER BY id');
    const friends = friendsResult.rows;

    console.log(`Found ${friends.length} friends in database:\n`);
    friends.forEach(f => console.log(`  - ${f.username} (ID: ${f.id})`));
    console.log('');

    const currentUser = process.env.DISCOGS_USERNAME;

    for (const friend of friends) {
      const { username, id: friendId } = friend;
      console.log(`\n📁 Processing ${username}...`);

      // Get all unique release_ids for this user
      const releasesResult = await pool.query(
        `SELECT DISTINCT release_id
         FROM tracks
         WHERE friend_id = $1 AND release_id IS NOT NULL
         ORDER BY release_id`,
        [friendId]
      );

      const releaseIds = releasesResult.rows.map(r => r.release_id);
      console.log(`  Found ${releaseIds.length} releases`);

      if (releaseIds.length === 0) {
        console.log('  ⚠️  No releases found, skipping...');
        continue;
      }

      // Process each release
      for (const releaseId of releaseIds) {
        try {
          // Get album data
          const albumResult = await pool.query(
            `SELECT * FROM albums WHERE release_id = $1 AND friend_id = $2`,
            [releaseId, friendId]
          );

          // Get tracks for this release
          const tracksResult = await pool.query(
            `SELECT * FROM tracks
             WHERE release_id = $1 AND friend_id = $2
             ORDER BY position`,
            [releaseId, friendId]
          );

          if (tracksResult.rows.length === 0) {
            console.log(`  ⚠️  No tracks found for release ${releaseId}`);
            continue;
          }

          const tracks = tracksResult.rows;
          const firstTrack = tracks[0];

          // Build release object from tracks and album data
          const album = albumResult.rows[0];

          const release = {
            id: releaseId,
            title: album?.title || firstTrack.album,
            artists_sort: album?.artist || firstTrack.artist,
            artists: [{ name: album?.artist || firstTrack.artist }],
            year: album?.year ? parseInt(album.year) : (firstTrack.year ? parseInt(firstTrack.year) : null),
            styles: album?.styles || firstTrack.styles || [],
            genres: album?.genres || firstTrack.genres || [],
            uri: album?.discogs_url || firstTrack.discogs_url,
            thumb: album?.album_thumbnail || firstTrack.album_thumbnail,
            date_added: album?.date_added || new Date().toISOString(),
            date_changed: album?.date_changed || new Date().toISOString(),
            labels: album?.label ? [{ name: album.label, catno: album.catalog_number || '' }] : [],
            country: album?.country || '',
            formats: album?.format || '',
            tracklist: tracks.map(track => ({
              position: track.position || '',
              title: track.title,
              duration: track.duration || '',
              duration_seconds: track.duration_seconds,
              artists: track.artist !== firstTrack.artist ? [{ name: track.artist }] : [],
              apple_music_url: track.apple_music_url,
              spotify_url: track.spotify_url,
              youtube_url: track.youtube_url,
              soundcloud_url: track.soundcloud_url,
              local_audio_url: track.local_audio_url,
            }))
          };

          // Determine release file path
          const isCurrentUser = currentUser && username === currentUser;
          const releaseFileName = isCurrentUser
            ? `release_${releaseId}.json`
            : `${username}_release_${releaseId}.json`;
          const releaseFilePath = path.join(DISCOGS_EXPORTS_DIR, releaseFileName);

          // Write release file
          fs.writeFileSync(releaseFilePath, JSON.stringify(release, null, 2));
        } catch (error) {
          console.log(`  ❌ Error processing release ${releaseId}:`, error.message);
        }
      }

      // Create manifest file
      const manifestFileName = currentUser && username === currentUser
        ? 'manifest.json'
        : `manifest_${username}.json`;
      const manifestPath = path.join(DISCOGS_EXPORTS_DIR, manifestFileName);

      const manifest = {
        username,
        releaseIds,
        deletedReleaseIds: [],
        lastSynced: new Date().toISOString(),
      };

      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`  ✅ Created ${manifestFileName} with ${releaseIds.length} releases`);
    }

    console.log('\n🎉 Manifest regeneration complete!\n');
    console.log(`Files written to: ${DISCOGS_EXPORTS_DIR}`);

  } catch (error) {
    console.error('❌ Error regenerating manifests:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
regenerateManifests();
