import type { DiscogsSimpleArtist, DiscogsVideo } from "@/types/discogs";

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
  composer?: string | undefined | null;
  bpm?: string | undefined | null;
  key?: string | undefined | null;
  danceability?: string | null;
  mood_happy?: number | null;
  mood_sad?: number | null;
  mood_relaxed?: number | null;
  mood_aggressive?: number | null;
  notes?: string | undefined | null;
  local_audio_url?: string;
  audio_file_album_art_url?: string | null;
  star_rating?: number;
  username?: string; // Username of the user who added this track
  _semanticScore?: number; // Optional semantic score for AI recommendations
  friend_id: number;
  release_id?: string;
  library_identifier?: string | null; // Alphanumeric library ID (e.g., LP001) for physical organization
  embedding?: string | number[] | null;
  _vectors?: { default?: number[] };
  hasVectors?: boolean;
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
  videos?: DiscogsVideo[];
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

export interface ProcessedTrack {
  position: string;
  title: string;
  duration: string;
  artists: DiscogsSimpleArtist[];
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
  username?: string;
  title: string;
  artist: string;
  year?: string;
  genres?: string[];
  styles?: string[];
  album_thumbnail?: string;
  audio_file_album_art_url?: string;
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
