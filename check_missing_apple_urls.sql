-- Check how many tracks are missing Apple Music URLs

-- Total tracks
SELECT COUNT(*) as total_tracks FROM tracks;

-- Tracks with Apple Music URLs
SELECT COUNT(*) as tracks_with_apple_music
FROM tracks
WHERE apple_music_url IS NOT NULL AND apple_music_url != '';

-- Tracks missing Apple Music URLs
SELECT COUNT(*) as tracks_missing_apple_music
FROM tracks
WHERE apple_music_url IS NULL OR apple_music_url = '';

-- Sample of tracks missing Apple Music URLs (first 10)
SELECT track_id, title, artist, album
FROM tracks
WHERE apple_music_url IS NULL OR apple_music_url = ''
LIMIT 10;
