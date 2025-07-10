-- Migration: Add local audio file URL to tracks table
ALTER TABLE tracks ADD COLUMN local_audio_url TEXT;
