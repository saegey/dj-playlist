import type { Track } from "@/types/track";

export type SimilarTrackBase = Pick<
  Track,
  | "track_id"
  | "friend_id"
  | "title"
  | "artist"
  | "album"
  | "year"
  | "genres"
  | "styles"
  | "local_tags"
  | "album_thumbnail"
  | "audio_file_album_art_url"
  | "bpm"
  | "key"
  | "star_rating"
  | "duration_seconds"
  | "position"
  | "discogs_url"
  | "apple_music_url"
  | "spotify_url"
  | "youtube_url"
  | "local_audio_url"
>;

export type SimilarIdentityTrack = SimilarTrackBase & {
  distance: number;
  identity_text: string;
};

export type SimilarVibeTrack = SimilarIdentityTrack &
  Pick<
    Track,
    "danceability" | "mood_happy" | "mood_sad" | "mood_relaxed" | "mood_aggressive"
  >;

export type SimilarityFilters = {
  era?: string;
  country?: string;
  tags?: string[];
};

export type EmbeddingTrackRef = Pick<Track, "track_id" | "friend_id">;
