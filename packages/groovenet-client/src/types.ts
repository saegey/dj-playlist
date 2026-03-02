// Core domain types for the Groovenet DJ collection system.
// Copied from my-collection-search/src/types/track.ts — Next.js app is the source of truth.

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
  username?: string;
  _semanticScore?: number;
  friend_id: number;
  release_id?: string;
  library_identifier?: string | null;
  embedding?: string | number[] | null;
  _vectors?: { default?: number[] };
  hasVectors?: boolean;
};

export interface Playlist {
  id: number;
  name: string;
  tracks: { track_id: string; friend_id: number; position: number }[];
  created_at: string;
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
  library_identifier?: string | null;
}

export interface YoutubeVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail?: string;
  url: string;
}

export interface AppleMusicResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork?: string;
  url: string;
  duration?: number;
}

export interface TrackSearchQuery {
  query?: string;
  limit?: number;
  offset?: number;
  filters?: {
    bpm_min?: number;
    bpm_max?: number;
    key?: string;
    star_rating?: number;
    friend_id?: number;
  };
}

export interface TrackSearchResponse {
  tracks: Track[];
  estimatedTotalHits: number;
  offset: number;
  limit: number;
  processingTimeMs: number;
}

export interface TrackUpdate {
  star_rating?: number;
  notes?: string;
  local_tags?: string;
  apple_music_url?: string;
  spotify_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
}

export interface PlaybackStatus {
  enabled: boolean;
  status: unknown;
}

export interface AlbumSearchQuery {
  q?: string;
  limit?: number;
  offset?: number;
  friend_id?: number;
  sort?: string;
}

export interface AlbumSearchResponse {
  hits: Album[];
  estimatedTotalHits: number;
  offset: number;
  limit: number;
  query: string;
  sort: string;
}

export interface AlbumDetail {
  album: Album;
  tracks: Track[];
}

export interface AlbumUpdate {
  album_rating?: number;
  album_notes?: string;
  purchase_price?: number;
  condition?: string;
  library_identifier?: string | null;
}

export interface AlbumDownloadResult {
  success: boolean;
  message: string;
  jobIds: string[];
  tracksQueued: number;
}
