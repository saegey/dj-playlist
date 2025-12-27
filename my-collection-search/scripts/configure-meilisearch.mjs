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

    // Configure embedders
    console.log('Setting up embedders...');
    try {
      await fetch(
        `${meiliClient.config.host}/indexes/tracks/settings/embedders`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${meiliClient.config.apiKey ?? ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            default: { source: 'userProvided', dimensions: 1536 },
          }),
        }
      );
      console.log('✅ Embedders configured\n');
    } catch (err) {
      console.warn('⚠️  Error setting embedders:', err.message);
    }

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
      'hasVectors',
      'youtube_url',
      'spotify_url',
      'soundcloud_url',
      'friend_id',
    ]);
    console.log('✅ Filterable attributes configured\n');

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

    console.log('🎉 MeiliSearch configuration complete!');
    console.log('\nNote: These settings will be applied asynchronously.');
    console.log('You can check the status at http://localhost:7700');

  } catch (error) {
    console.error('❌ Error configuring MeiliSearch:', error);
    process.exit(1);
  }
}

// Run the script
configureMeiliSearch();
