const fs = require('fs');

let tracks = JSON.parse(fs.readFileSync('./all_tracks.json', 'utf-8'));

tracks = tracks.map((track) => {
  if (track.track_id) {
    // Remove spaces and enforce valid characters only
    track.track_id = track.track_id.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
  }
  return track;
});

fs.writeFileSync('./all_tracks_cleaned.json', JSON.stringify(tracks, null, 2));
console.log('✅ Cleaned track IDs and wrote to all_tracks_cleaned.json');