#!/usr/bin/env python3
"""
Rebuild Apple Music URLs from audio file metadata using mediainfo
This script fixes tracks that lost their apple_music_url due to the Discogs sync bug
"""

import os
import re
import subprocess
import psycopg2
from urllib.parse import quote

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgres://djplaylist:djplaylistpassword@db:5432/djplaylist')
AUDIO_DIR = '/app/audio'

def get_mediainfo(file_path):
    """Extract metadata from audio file using mediainfo"""
    try:
        result = subprocess.run(
            ['mediainfo', file_path],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error running mediainfo: {e}")
        return None

def parse_apple_metadata(mediainfo_output):
    """Parse Apple-specific metadata from mediainfo output"""
    metadata = {}

    # Extract AppleStoreCatalogID (track ID)
    catalog_match = re.search(r'AppleStoreCatalogID\s*:\s*(\d+)', mediainfo_output)
    if catalog_match:
        metadata['track_id'] = catalog_match.group(1)

    # Extract AlbumTitleID (album ID)
    album_match = re.search(r'AlbumTitleID\s*:\s*(\d+)', mediainfo_output)
    if album_match:
        metadata['album_id'] = album_match.group(1)

    # Extract AppleStoreCountry
    country_match = re.search(r'AppleStoreCountry\s*:\s*(.+)', mediainfo_output)
    if country_match:
        country = country_match.group(1).strip()
        # Map country name to 2-letter code
        country_codes = {
            'United States': 'us',
            'United Kingdom': 'gb',
            'Canada': 'ca',
            'Australia': 'au',
            # Add more as needed
        }
        metadata['country'] = country_codes.get(country, 'us')
    else:
        metadata['country'] = 'us'

    return metadata

def build_apple_music_url(metadata):
    """Build Apple Music URL from metadata"""
    if 'track_id' not in metadata or 'album_id' not in metadata:
        return None

    # Format: https://music.apple.com/us/album/album-name/album-id?i=track-id
    # We don't have the album name slug, but the URL works without it
    country = metadata.get('country', 'us')
    album_id = metadata['album_id']
    track_id = metadata['track_id']

    return f"https://music.apple.com/{country}/album/{album_id}?i={track_id}"

def main():
    print("Rebuilding Apple Music URLs from audio file metadata...\n")

    # Connect to database
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    try:
        # Find tracks with audio files but missing apple_music_url
        cur.execute("""
            SELECT track_id, friend_id, local_audio_url, title, artist
            FROM tracks
            WHERE local_audio_url IS NOT NULL
              AND local_audio_url != ''
              AND (apple_music_url IS NULL OR apple_music_url = '')
            ORDER BY track_id
        """)

        tracks = cur.fetchall()
        print(f"Found {len(tracks)} tracks with audio but missing Apple Music URLs\n")

        if len(tracks) == 0:
            print("Nothing to do!")
            return

        updated_count = 0
        skipped_count = 0
        error_count = 0

        for track_id, friend_id, local_audio_url, title, artist in tracks:
            # Construct full file path
            audio_file = os.path.join(AUDIO_DIR, local_audio_url)

            if not os.path.exists(audio_file):
                print(f"⚠️  File not found: {audio_file}")
                skipped_count += 1
                continue

            print(f"Processing: {title} - {artist}")
            print(f"  File: {local_audio_url}")

            # Get mediainfo
            mediainfo_output = get_mediainfo(audio_file)
            if not mediainfo_output:
                print(f"  ❌ Failed to get mediainfo")
                error_count += 1
                continue

            # Parse Apple metadata
            metadata = parse_apple_metadata(mediainfo_output)

            if 'track_id' not in metadata:
                print(f"  ⚠️  No AppleStoreCatalogID found in metadata")
                skipped_count += 1
                continue

            # Build URL
            apple_url = build_apple_music_url(metadata)

            if not apple_url:
                print(f"  ⚠️  Could not build Apple Music URL")
                skipped_count += 1
                continue

            print(f"  ✅ Built URL: {apple_url}")

            # Update database
            cur.execute("""
                UPDATE tracks
                SET apple_music_url = %s
                WHERE track_id = %s AND friend_id = %s
            """, (apple_url, track_id, friend_id))

            updated_count += 1

        # Commit changes
        conn.commit()

        print(f"\n📊 Summary:")
        print(f"  ✅ Updated: {updated_count} tracks")
        print(f"  ⚠️  Skipped: {skipped_count} tracks")
        print(f"  ❌ Errors: {error_count} tracks")
        print(f"\n🎉 Done! Don't forget to re-index MeiliSearch:")
        print(f"   docker exec myapp node scripts/reindex-meilisearch.mjs")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    main()
