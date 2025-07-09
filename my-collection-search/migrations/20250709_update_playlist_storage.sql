ALTER TABLE playlists
  DROP COLUMN IF EXISTS tracks;

-- Join table for playlists and tracks (many-to-many)
CREATE TABLE IF NOT EXISTS playlist_tracks (
  playlist_id INTEGER REFERENCES playlists(id),
  track_id VARCHAR(255) REFERENCES tracks(track_id),
  PRIMARY KEY (playlist_id, track_id)
);
