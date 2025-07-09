-- Migration: Add audio analysis fields to tracks table
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS scale TEXT,
ADD COLUMN IF NOT EXISTS danceability REAL,
ADD COLUMN IF NOT EXISTS mood_happy REAL,
ADD COLUMN IF NOT EXISTS mood_sad REAL,
ADD COLUMN IF NOT EXISTS mood_relaxed REAL,
ADD COLUMN IF NOT EXISTS mood_aggressive REAL;
