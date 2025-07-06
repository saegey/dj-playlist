
require 'json'
require 'net/http'
require 'uri'
require 'fileutils'
require 'dotenv/load'


DISCOGS_USER_TOKEN = ENV['DISCOGS_USER_TOKEN']
USERNAME = ENV['DISCOGS_USERNAME']
FOLDER_ID = (ENV['DISCOGS_FOLDER_ID'] || 0).to_i  # 0 means "All" folder

OUTPUT_DIR = "./discogs_exports"
FileUtils.mkdir_p(OUTPUT_DIR)

def get_collection_page(page, per_page = 50)
  uri = URI("https://api.discogs.com/users/#{USERNAME}/collection/folders/#{FOLDER_ID}/releases?page=#{page}&per_page=#{per_page}")
  req = Net::HTTP::Get.new(uri)
  req['Authorization'] = "Discogs token=#{DISCOGS_USER_TOKEN}"

  res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
  raise "Error: #{res.code}" unless res.is_a?(Net::HTTPSuccess)

  JSON.parse(res.body)
end

def get_release_details(release_id)
  uri = URI("https://api.discogs.com/releases/#{release_id}")
  req = Net::HTTP::Get.new(uri)
  req['Authorization'] = "Discogs token=#{DISCOGS_USER_TOKEN}"

  res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
  raise "Error: #{res.code}" unless res.is_a?(Net::HTTPSuccess)

  JSON.parse(res.body)
end

# Fetch all pages
page = 1
per_page = 50

loop do
  puts "Fetching collection page #{page}..."
  collection_page = get_collection_page(page, per_page)
  releases = collection_page['releases']
  break if releases.nil? || releases.empty?

  releases.each do |release|
    release_id = release['basic_information']['id']
    begin
      puts "  → Fetching details for release ID #{release_id}..."
      details = get_release_details(release_id)

      # Save to local JSON file
      File.open("#{OUTPUT_DIR}/release_#{release_id}.json", "w") do |f|
        f.write(JSON.pretty_generate(details))
      end

      sleep(1.1)  # Rate limit: safe delay
    rescue => e
      puts "    ✖ Error fetching release #{release_id}: #{e.message}"
    end
  end

  # Check if there are more pages
  if collection_page['pagination']['page'] < collection_page['pagination']['pages']
    page += 1
  else
    break
  end
end

puts "✅ All done! Releases saved in #{OUTPUT_DIR}"