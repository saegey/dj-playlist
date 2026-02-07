#!/usr/bin/env node

/**
 * Re-index all tracks from PostgreSQL to MeiliSearch
 * This script is useful when you need to sync MeiliSearch with the current database state
 * (e.g., after bulk updates like resetting local_audio_url)
 *
 * Usage:
 *   node scripts/reindex-meilisearch.mjs
 */

import pg from 'pg';
import { MeiliSearch } from 'meilisearch';

const { Pool } = pg;

const BATCH_SIZE = 1000;

async function reindexMeiliSearch() {
  // Initialize connections
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  const meiliClient = new MeiliSearch({
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY || 'mysupersecretkey',
  });

  try {
    console.log('Starting MeiliSearch re-indexing...\n');

    // Fetch all tracks from database with library_identifier from albums
    console.log('Fetching tracks from database...');
    const trackResult = await pool.query(`
      SELECT t.*, a.library_identifier
      FROM tracks t
      LEFT JOIN albums a ON t.release_id = a.release_id AND t.friend_id = a.friend_id
      ORDER BY t.id
    `);
    const tracks = trackResult.rows;
    console.log(`Found ${tracks.length} tracks in database\n`);

    if (tracks.length === 0) {
      console.log('⚠️  No tracks found in database. Skipping track re-index.');
    } else {
      // Get or create tracks index
      console.log('Setting up MeiliSearch index...');
      let index;
      try {
        index = await meiliClient.getIndex('tracks');
        console.log('✅ Tracks index found\n');
      } catch (error) {
        console.log('Creating tracks index...');
        await meiliClient.createIndex('tracks', { primaryKey: 'id' });
        index = meiliClient.index('tracks');
        console.log('✅ Tracks index created\n');
      }

      // Process tracks in batches
      let processedCount = 0;
      const taskUids = [];

      for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
        const batch = tracks.slice(i, i + BATCH_SIZE);

        // Transform tracks for MeiliSearch
        const documents = batch.map((track) => {
          const { embedding, ...rest } = track;
          let vectorArr = null;

          // Parse embedding if it exists
          if (Array.isArray(embedding)) {
            vectorArr = embedding;
          } else if (typeof embedding === 'string') {
            try {
              vectorArr = JSON.parse(embedding);
            } catch (e) {
              // Ignore parsing errors
            }
          }

          return {
            ...rest,
            _vectors: { default: vectorArr },
            hasVectors: !!vectorArr,
          };
        });

        // Update documents in MeiliSearch
        console.log(
          `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tracks.length / BATCH_SIZE)} ` +
          `(${documents.length} documents)...`
        );

        const task = await index.updateDocuments(documents);
        taskUids.push(task.taskUid);
        processedCount += documents.length;
      }

      console.log(`\n✅ Enqueued ${processedCount} tracks for indexing`);
      console.log(`Task UIDs: ${taskUids.join(', ')}\n`);

      // Wait a few seconds for initial processing
      console.log('Waiting for MeiliSearch to start processing tracks...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Get final count from index
      console.log('\nFetching track index stats...');
      const stats = await index.getStats();
      console.log(`📈 Tracks in index: ${stats.numberOfDocuments}`);
    }

    // Fetch and index albums with library_identifier
    console.log('\nFetching albums from database...');
    const albumsResult = await pool.query(`
      SELECT
        release_id,
        friend_id,
        title,
        artist,
        year,
        genres,
        styles,
        album_thumbnail,
        discogs_url,
        date_added,
        date_changed,
        track_count,
        album_rating,
        album_notes,
        purchase_price,
        condition,
        label,
        catalog_number,
        country,
        format,
        library_identifier
      FROM albums
      ORDER BY release_id, friend_id
    `);
    const albums = albumsResult.rows;
    console.log(`Found ${albums.length} albums in database\n`);

    if (albums.length === 0) {
      console.log('⚠️  No albums found in database. Skipping album re-index.');
    } else {
      console.log('Setting up MeiliSearch albums index...');
      let albumsIndex;
      try {
        albumsIndex = await meiliClient.getIndex('albums');
        console.log('✅ Albums index found\n');
      } catch {
        console.log('Creating albums index...');
        await meiliClient.createIndex('albums', { primaryKey: 'id' });
        albumsIndex = meiliClient.index('albums');
        console.log('✅ Albums index created\n');
      }

      // Configure albums index for library identifiers and sorting/filtering
      await albumsIndex.updateSearchableAttributes([
        'title',
        'artist',
        'label',
        'catalog_number',
        'genres',
        'styles',
        'album_notes',
        'library_identifier',
      ]);

      await albumsIndex.updateFilterableAttributes([
        'friend_id',
        'release_id',
        'year',
        'genres',
        'styles',
        'album_rating',
        'condition',
        'date_added',
        'label',
        'format',
        'library_identifier',
      ]);

      await albumsIndex.updateSortableAttributes([
        'library_identifier',
        'date_added',
        'year',
        'title',
        'album_rating',
      ]);

      await albumsIndex.updateRankingRules([
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ]);

      let processedAlbums = 0;
      const albumTaskUids = [];

      for (let i = 0; i < albums.length; i += BATCH_SIZE) {
        const batch = albums.slice(i, i + BATCH_SIZE);
        const documents = batch.map((album) => ({
          id: `${album.release_id}_${album.friend_id}`,
          ...album,
        }));

        console.log(
          `Processing album batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(albums.length / BATCH_SIZE)} ` +
          `(${documents.length} documents)...`
        );

        const task = await albumsIndex.updateDocuments(documents);
        albumTaskUids.push(task.taskUid);
        processedAlbums += documents.length;
      }

      console.log(`\n✅ Enqueued ${processedAlbums} albums for indexing`);
      console.log(`Task UIDs: ${albumTaskUids.join(', ')}\n`);

      console.log('Waiting for MeiliSearch to start processing albums...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      const albumStats = await albumsIndex.getStats();
      console.log(`📈 Albums in index: ${albumStats.numberOfDocuments}`);
    }

    console.log(`\n✅ Re-indexing complete!`);
    console.log(`   - Tracks indexed: ${tracks.length}`);
    console.log(`   - Albums indexed: ${albums.length}`);
    console.log(`   - Tasks are processing in the background`);
    console.log(`   - Check MeiliSearch dashboard at ${process.env.MEILISEARCH_HOST || 'http://localhost:7700'} for status\n`);

  } catch (error) {
    console.error('❌ Error during re-indexing:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
reindexMeiliSearch();
