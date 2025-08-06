import { NextResponse } from "next/server";

// --- Types for reference ---
interface Track {
  track_id: string;
  title: string;
  artist: string;
  album: string;
  year: number | null;
  styles: string[];
  genres: string[];
  duration: string | null;
  discogs_url: string | null;
  album_thumbnail: string | null;
  position: string;
  duration_seconds: number | null;
  bpm: number | null;
  key: string | null;
  notes: string | null;
  local_tags: string[];
  apple_music_url: string | null;
  local_audio_url: string | null;
  username: string;
}

type SpotifyTrack = {
  added_at: string;
  track: {
    album: {
      name: string;
      release_date: string;            // e.g. "2022-07-15" or "2022"
      images: { url: string }[];
    };
    artists: { name: string }[];
    disc_number: number;
    track_number: number;
    duration_ms: number;
    preview_url: string | null;
    id: string;
    name: string;
  };
};

// --- Converter function ---
/**
 * Convert one SpotifyTrack into your internal Track shape.
 *
 * @param spotifyTrack  the raw object from Spotify’s API
 * @param username      the local username to stamp on this record
 */
function spotifyToTrack(
  spotifyTrack: SpotifyTrack,
  username: string
): Track {
  const t = spotifyTrack.track;

  // 1) Year → parse from release_date (first 4 chars)
  let year: number | null = null;
  if (t.album.release_date && t.album.release_date.length >= 4) {
    const y = parseInt(t.album.release_date.slice(0, 4), 10);
    if (!isNaN(y)) year = y;
  }

  // 2) Duration formatting
  const durationSeconds =
    typeof t.duration_ms === 'number'
      ? Math.floor(t.duration_ms / 1000)
      : null;

  const duration =
    durationSeconds !== null
      ? `${Math.floor(durationSeconds / 60)}:${String(
          durationSeconds % 60
        ).padStart(2, '0')}`
      : null;

  // 3) Build the Track
  return {
    track_id: t.id,
    title: t.name,
    artist: t.artists.map((a) => a.name).join(', '),
    album: t.album.name,
    year,
    styles: [],                    // Spotify doesn’t expose “styles”
    genres: [],                    // neither does it expose “genres” at track level
    duration,
    discogs_url: null,             // no Discogs link from Spotify
    album_thumbnail:
      t.album.images.length > 0 ? t.album.images[0].url : null,
    position: `${t.disc_number}-${t.track_number}`,
    duration_seconds: durationSeconds,
    bpm: null,                     // Spotify’s audio-features endpoint has BPM, but not here
    key: null,                     // likewise, you'd need a separate call for key
    notes: null,                   // you can fill this in later if you like
    local_tags: [],                // your tags, not provided by Spotify
    apple_music_url: null,         // you'd need a separate lookup
    local_audio_url: t.preview_url,
    username,
  };
}

export async function POST() {
  // TODO: Implement Spotify index update logic here
  // This is a scaffold endpoint
  return new NextResponse(
    JSON.stringify({ message: "Spotify index update scaffold complete." }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
