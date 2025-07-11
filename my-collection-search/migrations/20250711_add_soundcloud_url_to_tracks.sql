-- Add soundcloud_url column to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS soundcloud_url TEXT;
