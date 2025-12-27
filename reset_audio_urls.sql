-- Reset local_audio_url for all tracks
-- This is useful when the audio volume has been lost and files need to be re-downloaded

UPDATE tracks
SET local_audio_url = NULL
WHERE local_audio_url IS NOT NULL;

-- Show how many tracks were updated
SELECT COUNT(*) as tracks_updated
FROM tracks
WHERE local_audio_url IS NULL;
