-- Migration: Add apple_music_persistent_id column to tracks table
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS apple_music_persistent_id VARCHAR(32) UNIQUE;
