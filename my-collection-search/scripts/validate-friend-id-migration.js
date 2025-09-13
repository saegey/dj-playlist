#!/usr/bin/env node

/**
 * Script to validate friend_id migration data integrity
 * Run this after the migration to ensure data consistency
 * 
 * Usage: node scripts/validate-friend-id-migration.js
 */

import { Pool } from 'pg';
import process from 'process';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function validateMigration() {
  console.log('🔍 Validating friend_id migration...\n');
  
  try {
    // Check 1: Verify all tracks have friend_id
    const tracksWithoutFriendId = await pool.query(
      'SELECT COUNT(*) FROM tracks WHERE friend_id IS NULL'
    );
    console.log(`❌ Tracks without friend_id: ${tracksWithoutFriendId.rows[0].count}`);
    
    // Check 2: Verify all playlist_tracks have friend_id
    const playlistTracksWithoutFriendId = await pool.query(
      'SELECT COUNT(*) FROM playlist_tracks WHERE friend_id IS NULL'
    );
    console.log(`❌ Playlist tracks without friend_id: ${playlistTracksWithoutFriendId.rows[0].count}`);
    
    // Check 3: Verify friend_id matches username
    const mismatchedTracks = await pool.query(`
      SELECT t.track_id, t.username, f.username as friend_username, t.friend_id, f.id as friend_id_check
      FROM tracks t 
      JOIN friends f ON t.friend_id = f.id 
      WHERE t.username != f.username
      LIMIT 10
    `);
    
    if (mismatchedTracks.rows.length > 0) {
      console.log(`❌ Found ${mismatchedTracks.rowCount} tracks with mismatched username/friend_id:`);
      mismatchedTracks.rows.forEach(row => {
        console.log(`  - Track: ${row.track_id}, Username: "${row.username}", Friend Username: "${row.friend_username}"`);
      });
    } else {
      console.log(`✅ All tracks have matching username/friend_id mappings`);
    }
    
    // Check 4: Verify playlist_tracks friend_id consistency
    const inconsistentPlaylistTracks = await pool.query(`
      SELECT pt.playlist_id, pt.track_id, pt.friend_id as pt_friend_id, t.friend_id as t_friend_id
      FROM playlist_tracks pt
      JOIN tracks t ON pt.track_id = t.track_id
      WHERE pt.friend_id != t.friend_id
      LIMIT 10
    `);
    
    if (inconsistentPlaylistTracks.rows.length > 0) {
      console.log(`❌ Found ${inconsistentPlaylistTracks.rowCount} playlist_tracks with inconsistent friend_id:`);
      inconsistentPlaylistTracks.rows.forEach(row => {
        console.log(`  - Playlist: ${row.playlist_id}, Track: ${row.track_id}, PT friend_id: ${row.pt_friend_id}, T friend_id: ${row.t_friend_id}`);
      });
    } else {
      console.log(`✅ All playlist_tracks have consistent friend_id with tracks`);
    }
    
    // Check 5: Summary statistics
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM tracks) as total_tracks,
        (SELECT COUNT(*) FROM playlist_tracks) as total_playlist_tracks,
        (SELECT COUNT(*) FROM friends) as total_friends,
        (SELECT COUNT(DISTINCT friend_id) FROM tracks) as friends_with_tracks
    `);
    
    const { total_tracks, total_playlist_tracks, total_friends, friends_with_tracks } = stats.rows[0];
    
    console.log('\n📊 Migration Summary:');
    console.log(`  - Total tracks: ${total_tracks}`);
    console.log(`  - Total playlist tracks: ${total_playlist_tracks}`);  
    console.log(`  - Total friends: ${total_friends}`);
    console.log(`  - Friends with tracks: ${friends_with_tracks}`);
    
    // Check 6: Sample data verification
    const sampleData = await pool.query(`
      SELECT t.track_id, t.username, t.friend_id, f.username as friend_username
      FROM tracks t
      JOIN friends f ON t.friend_id = f.id
      LIMIT 5
    `);
    
    console.log('\n🔍 Sample data verification:');
    sampleData.rows.forEach(row => {
      console.log(`  - Track: ${row.track_id}, Username: "${row.username}", Friend ID: ${row.friend_id}, Friend Username: "${row.friend_username}"`);
    });
    
    console.log('\n✅ Migration validation complete!');
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateMigration().catch(console.error);
}