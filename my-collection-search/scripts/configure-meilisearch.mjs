#!/usr/bin/env node

/**
 * Configure MeiliSearch tracks index with proper searchable, filterable, and sortable attributes
 *
 * Usage:
 *   node scripts/configure-meilisearch.mjs
 */

import { MeiliSearch } from 'meilisearch';

const meiliClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || 'mysupersecretkey',
});

async function configureMeiliSearch() {
  try {
    console.log('Configuring MeiliSearch tracks index...\n');

    const index = meiliClient.index('tracks');

    // Configure searchable attributes
    console.log('Configuring searchable attributes...');
    await index.updateSearchableAttributes([
      'local_tags',
      'artist',
      'album',
      'styles',
      'title',
      'notes',
      'genres',
      'library_identifier',
    ]);
    console.log('✅ Searchable attributes configured\n');

    // Configure filterable attributes
    console.log('Configuring filterable attributes...');
    await index.updateFilterableAttributes([
      'track_id',
      'bpm',
      'genres',
      'key',
      'year',
      'local_tags',
      'styles',
      'local_audio_url',
      'apple_music_url',
      'youtube_url',
      'spotify_url',
      'soundcloud_url',
      'friend_id',
      'library_identifier',
    ]);
    console.log('✅ Filterable attributes configured\n');

    // Configure sortable attributes
    console.log('Configuring sortable attributes...');
    await index.updateSortableAttributes([
      'library_identifier',
      'year',
      'bpm',
      'star_rating',
    ]);
    console.log('✅ Sortable attributes configured\n');

    // Configure ranking rules
    console.log('Configuring ranking rules...');
    await index.updateRankingRules([
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
    ]);
    console.log('✅ Ranking rules configured\n');

    // Configure albums index
    console.log('\nConfiguring MeiliSearch albums index...\n');

    const albumsIndex = meiliClient.index('albums');

    // Configure searchable attributes for albums
    console.log('Configuring albums searchable attributes...');
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
    console.log('✅ Albums searchable attributes configured\n');

    // Configure filterable attributes for albums
    console.log('Configuring albums filterable attributes...');
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
    console.log('✅ Albums filterable attributes configured\n');

    // Configure sortable attributes for albums
    console.log('Configuring albums sortable attributes...');
    await albumsIndex.updateSortableAttributes([
      'library_identifier',
      'date_added',
      'year',
      'title',
      'album_rating',
    ]);
    console.log('✅ Albums sortable attributes configured\n');

    console.log('🎉 MeiliSearch configuration complete for both tracks and albums!');
    console.log('\nNote: These settings will be applied asynchronously.');
    console.log('You can check the status at http://localhost:7700');

  } catch (error) {
    console.error('❌ Error configuring MeiliSearch:', error);
    process.exit(1);
  }
}

// Run the script
configureMeiliSearch();
