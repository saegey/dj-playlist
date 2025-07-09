DROP TABLE IF EXISTS tracks;
DROP TABLE IF EXISTS playlists;
-- SQL for tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id SERIAL PRIMARY KEY,
  track_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  album VARCHAR(255),
  year VARCHAR(10),
  styles TEXT[],
  genres TEXT[],
  duration VARCHAR(20),
  position VARCHAR(20),
  discogs_url TEXT,
  apple_music_url TEXT,
  album_thumbnail TEXT,
  local_tags TEXT,
  bpm VARCHAR(10) DEFAULT NULL,
  key VARCHAR(10) DEFAULT NULL,
  duration_seconds INTEGER,
  notes TEXT DEFAULT '',
  apple_music_persistent_id VARCHAR(32) UNIQUE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS playlists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tracks TEXT[] NOT NULL, -- now stores array of track_id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
