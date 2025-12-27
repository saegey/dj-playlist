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

    // Fetch all tracks from database
    console.log('Fetching tracks from database...');
    const result = await pool.query('SELECT * FROM tracks ORDER BY id');
    const tracks = result.rows;
    console.log(`Found ${tracks.length} tracks in database\n`);

    if (tracks.length === 0) {
      console.log('⚠️  No tracks found in database. Nothing to index.');
      return;
    }

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
    console.log('Waiting for MeiliSearch to process tasks...\n');

    // Poll tasks until all are complete (manual polling since waitForTask isn't available)
    const totalTasks = taskUids.length;
    const completedTaskUids = new Set();
    const failedTaskUids = new Set();
    const maxAttempts = 60; // 60 attempts x 2 seconds = 2 minutes max
    let attempts = 0;

    while (completedTaskUids.size + failedTaskUids.size < totalTasks && attempts < maxAttempts) {
      attempts++;

      // Check each task status
      for (const taskUid of taskUids) {
        // Skip if already processed
        if (completedTaskUids.has(taskUid) || failedTaskUids.has(taskUid)) {
          continue;
        }

        try {
          const task = await meiliClient.getTask(taskUid);

          if (task.status === 'succeeded') {
            completedTaskUids.add(taskUid);
            console.log(`✅ Task ${taskUid} completed`);
          } else if (task.status === 'failed') {
            failedTaskUids.add(taskUid);
            console.error(`❌ Task ${taskUid} failed:`, task.error);
          }
        } catch (error) {
          console.error(`Error checking task ${taskUid}:`, error.message);
        }
      }

      // If there are still pending tasks, wait before checking again
      if (completedTaskUids.size + failedTaskUids.size < totalTasks) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }

    const pendingTasks = totalTasks - completedTaskUids.size - failedTaskUids.size;
    if (attempts >= maxAttempts && pendingTasks > 0) {
      console.log(`\n⚠️  Timeout: ${pendingTasks} tasks still pending after ${maxAttempts * 2} seconds`);
    }

    console.log(`\n📊 Indexing results:`);
    console.log(`   ✅ Succeeded: ${completedTaskUids.size} batches`);
    if (failedTaskUids.size > 0) {
      console.log(`   ❌ Failed: ${failedTaskUids.size} batches`);
    }

    // Get final count from index
    console.log('\nFetching final index stats...');
    const stats = await index.getStats();
    console.log(`📈 Total documents in index: ${stats.numberOfDocuments}\n`);

  } catch (error) {
    console.error('❌ Error during re-indexing:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
reindexMeiliSearch();
