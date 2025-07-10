-- 2025-07-10_add_position_to_playlist_tracks.sql

ALTER TABLE playlist_tracks
ADD COLUMN position INT;

-- Optional: If you want to ensure position is always present and unique per playlist:
-- ALTER TABLE playlist_tracks
-- ALTER COLUMN position SET NOT NULL;

-- CREATE UNIQUE INDEX playlist_tracks_playlist_id_position_idx
-- ON playlist_tracks (playlist_id, position);