const { MeiliSearch } = require('meilisearch');
const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

// Configure Postgres connection (update with your .env or hardcode for testing)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const client = new MeiliSearch({ host: 'http://127.0.0.1:7700', apiKey: 'masterKey' });

async function insertTrack(track) {
  const query = `
    INSERT INTO tracks (
      track_id, title, artist, album, year, styles, genres, duration, position, discogs_url, apple_music_url, album_thumbnail
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    )
    ON CONFLICT (track_id) DO NOTHING
  `;
  const values = [
    track.track_id,
    track.title,
    track.artist,
    track.album,
    track.year,
    track.styles || null,
    track.genres || null,
    track.duration,
    track.position,
    track.discogs_url,
    track.apple_music_url,
    track.album_thumbnail,
  ];
  await pool.query(query, values);
}

async function indexTracks() {
  const tracks = JSON.parse(fs.readFileSync('./all_tracks_cleaned.json', 'utf-8'));

  // Insert into Postgres
  for (const track of tracks) {
    await insertTrack(track);
  }
  console.log(`✅ Inserted ${tracks.length} tracks into Postgres`);

  // Index in MeiliSearch
  const index = client.index('tracks', { primaryKey: 'track_id' });
  await index.updateSearchableAttributes(['title', 'artist', 'album', 'local_tags', 'styles', 'genres']);
  await index.updateFilterableAttributes(['year', 'styles', 'genres', 'local_tags', 'bpm', 'key']);
  const { taskUid } = await index.addDocuments(tracks);
  console.log(`🚀 Added ${tracks.length} tracks to MeiliSearch (task UID: ${taskUid})`);

  await pool.end();
}

indexTracks();