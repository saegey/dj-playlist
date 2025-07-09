-- Migration: Add audio analysis fields to tracks table
ALTER TABLE tracks ADD COLUMN youtube_url TEXT;