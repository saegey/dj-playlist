-- One-time backfill script for existing installations
-- This populates the release_id field in tracks table from track_id

-- Update release_id by extracting it from track_id
-- track_id format is: {release_id}-{position}
UPDATE tracks
SET release_id = SPLIT_PART(track_id, '-', 1)
WHERE release_id IS NULL OR release_id = '';

-- Verify the update
SELECT
  COUNT(*) as total_tracks,
  COUNT(release_id) as tracks_with_release_id,
  COUNT(*) - COUNT(release_id) as tracks_without_release_id
FROM tracks;

-- Show sample of updated tracks
SELECT track_id, title, release_id
FROM tracks
WHERE release_id IS NOT NULL
LIMIT 10;
