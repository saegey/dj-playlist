#!/usr/bin/env node

/**
 * Rebuild Apple Music URLs from audio file metadata using mediainfo
 * This script fixes tracks that lost their apple_music_url due to the Discogs sync bug
 */

import pg from 'pg';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://djplaylist:djplaylistpassword@db:5432/djplaylist';
const AUDIO_DIR = '/app/audio';

function getMediaInfo(filePath) {
  try {
    const output = execSync(`mediainfo "${filePath}"`, { encoding: 'utf8' });
    return output;
  } catch (error) {
    console.error(`Error running mediainfo: ${error.message}`);
    return null;
  }
}

function parseAppleMetadata(mediainfoOutput) {
  const metadata = {};

  // Extract AppleStoreCatalogID (track ID)
  const catalogMatch = mediainfoOutput.match(/AppleStoreCatalogID\s*:\s*(\d+)/);
  if (catalogMatch) {
    metadata.trackId = catalogMatch[1];
  }

  // Extract PlayListID (album ID - this is what Apple Music uses in URLs)
  const albumMatch = mediainfoOutput.match(/PlayListID\s*:\s*(\d+)/);
  if (albumMatch) {
    metadata.albumId = albumMatch[1];
  }

  // Extract AppleStoreCountry
  const countryMatch = mediainfoOutput.match(/AppleStoreCountry\s*:\s*(.+)/);
  if (countryMatch) {
    const country = countryMatch[1].trim();
    // Map country name to 2-letter code
    const countryCodes = {
      'United States': 'us',
      'United Kingdom': 'gb',
      'Canada': 'ca',
      'Australia': 'au',
      'Germany': 'de',
      'France': 'fr',
      'Spain': 'es',
      'Italy': 'it',
      'Japan': 'jp',
      'Brazil': 'br',
      'Mexico': 'mx',
    };
    metadata.country = countryCodes[country] || 'us';
  } else {
    metadata.country = 'us';
  }

  return metadata;
}

function buildAppleMusicUrl(metadata) {
  if (!metadata.trackId || !metadata.albumId) {
    return null;
  }

  // Format: https://music.apple.com/us/album/album-id?i=track-id
  const country = metadata.country || 'us';
  const albumId = metadata.albumId;
  const trackId = metadata.trackId;

  return `https://music.apple.com/${country}/album/${albumId}?i=${trackId}`;
}

async function main() {
  console.log('Rebuilding Apple Music URLs from audio file metadata...\n');

  // Check if mediainfo is available
  try {
    execSync('which mediainfo', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ mediainfo is not installed!');
    console.error('Install it with: apt-get update && apt-get install -y mediainfo');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Find tracks with audio files but missing apple_music_url
    const result = await pool.query(`
      SELECT track_id, friend_id, local_audio_url, title, artist
      FROM tracks
      WHERE local_audio_url IS NOT NULL
        AND local_audio_url != ''
        AND (apple_music_url IS NULL OR apple_music_url = '')
      ORDER BY track_id
    `);

    const tracks = result.rows;
    console.log(`Found ${tracks.length} tracks with audio but missing Apple Music URLs\n`);

    if (tracks.length === 0) {
      console.log('Nothing to do!');
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const track of tracks) {
      const { track_id, friend_id, local_audio_url, title, artist } = track;

      // Construct full file path
      const audioFile = path.join(AUDIO_DIR, local_audio_url);

      if (!fs.existsSync(audioFile)) {
        console.log(`⚠️  File not found: ${audioFile}`);
        skippedCount++;
        continue;
      }

      console.log(`Processing: ${title} - ${artist}`);
      console.log(`  File: ${local_audio_url}`);

      // Get mediainfo
      const mediainfoOutput = getMediaInfo(audioFile);
      if (!mediainfoOutput) {
        console.log(`  ❌ Failed to get mediainfo`);
        errorCount++;
        continue;
      }

      // Parse Apple metadata
      const metadata = parseAppleMetadata(mediainfoOutput);

      if (!metadata.trackId) {
        console.log(`  ⚠️  No AppleStoreCatalogID found in metadata`);
        skippedCount++;
        continue;
      }

      // Build URL
      const appleUrl = buildAppleMusicUrl(metadata);

      if (!appleUrl) {
        console.log(`  ⚠️  Could not build Apple Music URL`);
        skippedCount++;
        continue;
      }

      console.log(`  ✅ Built URL: ${appleUrl}`);

      // Update database
      await pool.query(
        `UPDATE tracks
         SET apple_music_url = $1
         WHERE track_id = $2 AND friend_id = $3`,
        [appleUrl, track_id, friend_id]
      );

      updatedCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Updated: ${updatedCount} tracks`);
    console.log(`  ⚠️  Skipped: ${skippedCount} tracks`);
    console.log(`  ❌ Errors: ${errorCount} tracks`);
    console.log(`\n🎉 Done! Don't forget to re-index MeiliSearch:`);
    console.log(`   docker exec myapp node scripts/reindex-meilisearch.mjs`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    throw error;
  } finally {
    await pool.end();
  }
}

main();
