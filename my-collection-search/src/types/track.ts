export type Track = {
  id: number;
  track_id: string;
  isrc?: string;
  title: string;
  artist: string;
  album: string;
  year: string | number;
  styles?: string[];
  genres?: string[];
  duration: string;
  duration_seconds?: number;
  position: number;
  discogs_url: string;
  apple_music_url: string;
  youtube_url?: string;
  spotify_url?: string;
  soundcloud_url?: string;
  album_thumbnail?: string;
  local_tags?: string | undefined;
  bpm?: string | undefined | null;
  key?: string | undefined | null;
  danceability?: string | null;
  mood_happy?: number | null;
  mood_sad?: number | null;
  mood_relaxed?: number | null;
  mood_aggressive?: number | null;
  notes?: string | undefined | null;
  local_audio_url?: string;
  star_rating?: number;
  username?: string; // Username of the user who added this track
  _semanticScore?: number; // Optional semantic score for AI recommendations
  friend_id: number;
  release_id?: string;
  library_identifier?: string | null; // Alphanumeric library ID (e.g., LP001) for physical organization
};

// Spotify track type based on API response
export type SpotifyTrack = {
  added_at: string;
  track: {
    album: {
      album_type: string;
      artists: Array<{
        external_urls: { spotify: string };
        href: string;
        id: string;
        name: string;
        type: string;
        uri: string;
      }>;
      available_markets: string[];
      external_urls: { spotify: string };
      href: string;
      id: string;
      images: Array<{
        height: number;
        width: number;
        url: string;
      }>;
      is_playable: boolean;
      name: string;
      release_date: string;
      release_date_precision: string;
      total_tracks: number;
      type: string;
      uri: string;
    };
    artists: Array<{
      external_urls: { spotify: string };
      href: string;
      id: string;
      name: string;
      type: string;
      uri: string;
    }>;
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_ids: { isrc: string };
    external_urls: { spotify: string };
    href: string;
    id: string;
    is_local: boolean;
    is_playable: boolean;
    name: string;
    popularity: number;
    preview_url: string | null;
    track_number: number;
    type: string;
    uri: string;
  };
};

export type YoutubeVideo = {
  id: string;
  title: string;
  channel: string;
  thumbnail?: string;
  url: string;
};

export type AppleMusicResult = {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork?: string;
  url: string;
  duration?: number;
};

export interface Playlist {
  id: number;
  name: string;
  tracks: { track_id: string; friend_id: number; position: number }[];
  created_at: string;
}

export type SpotifyApiTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images?: { url: string }[];
  };
  external_urls: { spotify: string };
  duration_ms: number;
};

export interface DiscogsRelease {
  id: number | string;
  title: string;
  artists?: { name: string }[];
  artists_sort?: string;
  year?: number;
  styles?: string[];
  genres?: string[];
  uri?: string;
  thumb?: string;
  videos?: { uri: string; title: string; description?: string; duration?: number; embed?: boolean }[];
  tracklist: ProcessedTrack[];
  date_added: string;
  date_changed: string;
  labels?: Array<{ name: string; catno: string }>;
  country?: string;
  formats?: string;
};

export interface DiscogsTrack {
  track_id: string;
  release_id?: string; // Discogs release ID for linking to albums
  title: string;
  artist: string;
  album: string;
  year: number | null;
  styles: string[];
  genres: string[];
  duration: string;
  discogs_url: string;
  album_thumbnail: string;
  position: string;
  duration_seconds: number | null;
  bpm: number | null;
  key: string | null;
  notes: string | null;
  local_tags: string[];
  apple_music_url: string | null;
  local_audio_url: string | null;
  username: string;
  date_added?: string | null; // When user added to Discogs collection
  friend_id?: number; // resolved via friends table during upsert/index
}

interface DiscogsArtist {
  name: string;
}
export interface ProcessedTrack {
  position: string;
  title: string;
  duration: string;
  artists: DiscogsArtist[];
  duration_seconds?: number | null;
  apple_music_url?: string | null;
  spotify_url?: string | null;
  youtube_url?: string | null;
  soundcloud_url?: string | null;
  local_audio_url?: string | null;
}

export interface Friend {
  id: number;
  username: string;
}

export interface Album {
  release_id: string;
  friend_id: number;
  title: string;
  artist: string;
  year?: string;
  genres?: string[];
  styles?: string[];
  album_thumbnail?: string;
  discogs_url?: string;
  date_added?: string;
  date_changed?: string;
  track_count: number;
  album_rating?: number;
  album_notes?: string;
  purchase_price?: number;
  condition?: string;
  label?: string;
  catalog_number?: string;
  country?: string;
  format?: string;
  created_at?: string;
  updated_at?: string;
  library_identifier?: string | null; // Alphanumeric library ID (e.g., LP001) for physical organization
}
