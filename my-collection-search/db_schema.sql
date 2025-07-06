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
  album_thumbnail TEXT
);

-- SQL for playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tracks JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
