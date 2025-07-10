-- Migration: Add star_rating to tracks table
ALTER TABLE tracks ADD COLUMN star_rating INTEGER DEFAULT 0;
