-- 20250710_playlist_tracks_cascade.sql
-- Add ON DELETE CASCADE to playlist_tracks.playlist_id foreign key

ALTER TABLE playlist_tracks
DROP CONSTRAINT IF EXISTS playlist_tracks_playlist_id_fkey;

ALTER TABLE playlist_tracks
ADD CONSTRAINT playlist_tracks_playlist_id_fkey
FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE;
