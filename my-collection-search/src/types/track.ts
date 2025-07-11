export type Track = {
  track_id: string;
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
  soundcloud_url?: string;
  album_thumbnail?: string;
  local_tags?: string;
  bpm?: string | null;
  key?: string | null;
  danceability?: number | null;
  mood_happy?: number | null;
  mood_sad?: number | null;
  mood_relaxed?: number | null;
  mood_aggressive?: number | null;
  notes?: string;
  local_audio_url?: string;
  star_rating?: number;
  username?: string; // Username of the user who added this track
};
