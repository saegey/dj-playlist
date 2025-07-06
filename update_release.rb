
require 'json'
require 'net/http'
require 'uri'
require 'openssl'
require 'jwt'
require 'dotenv/load'


# Load Apple credentials from environment variables
TEAM_ID = ENV["APPLE_MUSIC_TEAM_ID"]
KEY_ID = ENV["APPLE_MUSIC_KEY_ID"]
PRIVATE_KEY_PATH = "./AuthKey_#{KEY_ID}.p8" # Your private .p8 file


# Check if file or directory path was provided
if ARGV.length < 1
  puts "Usage: ruby update_release.rb <path_to_release_file.json | directory>"
  exit 1
end

input_path = ARGV[0]
files = []
if File.directory?(input_path)
  all_jsons = Dir.glob(File.join(input_path, '*.json'))
  # Skip *_updated.json and skip base files if *_updated.json exists
  # updated_basenames = all_jsons.select { |f| f =~ /_updated\.json$/ }
  #   .map { |f| File.basename(f).sub('_updated.json', '') }
  # files = all_jsons.reject do |f|
  #   fname = File.basename(f)
  #   fname =~ /_updated\.json$/ || updated_basenames.include?(fname.sub('.json', ''))
  # end
  files = all_jsons
  if files.empty?
    puts "❌ No JSON files found in directory: #{input_path}"
    exit 1
  end
else
  unless File.exist?(input_path)
    puts "❌ File not found: #{input_path}"
    exit 1
  end
  files = [input_path]
end

# Create developer token
def generate_developer_token
  private_key = OpenSSL::PKey::EC.new(File.read(PRIVATE_KEY_PATH))

  headers = {
    alg: 'ES256',
    kid: KEY_ID
  }

  claims = {
    iss: TEAM_ID,
    iat: Time.now.to_i,
    exp: (Time.now + 60 * 60 * 24 * 180).to_i # valid for 6 months
  }

  JWT.encode(claims, private_key, 'ES256', headers)
end

def search_apple_music(track_title, artist_name, developer_token)
  query = URI.encode_www_form_component("#{track_title} #{artist_name}")
  uri = URI("https://api.music.apple.com/v1/catalog/us/search?term=#{query}&types=songs&limit=1")

  req = Net::HTTP::Get.new(uri)
  req['Authorization'] = "Bearer #{developer_token}"

  res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
    http.request(req)
  end

  json = JSON.parse(res.body)
  song_data = json.dig("results", "songs", "data", 0)
  return nil unless song_data

  attributes = song_data["attributes"]
  apple_music_url = attributes["url"]
  duration_ms = attributes["durationInMillis"]

  return {
    url: apple_music_url,
    duration_seconds: duration_ms ? (duration_ms / 1000.0).round : nil
  }
end


files.each_with_index do |file_path, idx|
  puts "\nProcessing #{file_path} (#{idx+1}/#{files.size})"
  release = JSON.parse(File.read(file_path))
  developer_token = generate_developer_token

  release["tracklist"].each do |track|
    artist_name = release["artists_sort"] || release.dig("artists", 0, "name") || "Unknown"

    puts "Searching: #{track["title"]} by #{artist_name}"

    result = search_apple_music(track["title"], artist_name, developer_token)
    if result
      track["apple_music_url"] = result[:url]
      track["apple_music_duration"] = result[:duration_seconds]
      puts "✅ Found: #{result[:url]} (Duration: #{result[:duration_seconds]}s)"
    else
      puts "❌ Not found"
    end
  end

  # Save updated file
  updated_path = file_path.sub(/\.json$/, "_updated.json")
  File.write(updated_path, JSON.pretty_generate(release))
  puts "🎉 Updated file saved to #{updated_path}"

  # Sleep for 1 minute between files, except after the last one
  if idx < files.size - 1
    puts "⏳ Sleeping for 1 minute before next file..."
    # sleep(60)
    sleep(2)
  end
end