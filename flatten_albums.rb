require 'json'
require 'pathname'

albums_dir = './discogs_exports'  # directory with all your album JSON files
output_file = './all_tracks.json'

all_tracks = []


Dir.glob("#{albums_dir}/release_*.json").each do |file_path|
  # Prefer *_updated.json if it exists
  if file_path =~ /release_(\d+)\.json$/
    base_id = $1
    updated_path = File.join(albums_dir, "release_#{base_id}_updated.json")
    use_path = File.exist?(updated_path) ? updated_path : file_path
  else
    use_path = file_path
  end

  album = JSON.parse(File.read(use_path))

  artist_name = album['artists_sort'] || album.dig('artists', 0, 'name') || 'Unknown Artist'
  album_title = album['title']
  album_year = album['year']
  album_styles = album['styles'] || []
  album_genres = album['genres'] || []
  discogs_url = album['uri']
  thumbnail = album['thumb']

  (album['tracklist'] || []).each do |track|
    all_tracks << {
      track_id: "#{album['id']}-#{track['position']}",
      title: track['title'],
      artist: !track['artists'].nil? ?  track['artists'].map { 
        |a| a['name'] }.join(', ') : artist_name,  # Join multiple artists
      album: album_title,
      year: album_year,
      styles: album_styles,
      genres: album_genres,
      duration: track['duration'],
      duration_seconds: track['apple_music_duration'] || nil,  # Use Apple Music duration if available
      discogs_url: discogs_url,
      apple_music_url: track['apple_music_url'],  # Placeholder for Apple Music URL
      local_tags: [],  # You can add custom tags later
      bpm: nil,
      key: nil,
      album_thumbnail: thumbnail,
      position: track['position'] || '',  # Use position from tracklist
    }
  end
end

File.write(output_file, JSON.pretty_generate(all_tracks))

puts "✅ Flattened #{all_tracks.size} tracks and wrote to #{output_file}"