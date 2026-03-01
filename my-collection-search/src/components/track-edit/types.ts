export interface TrackEditFormProps {
  track_id: string;
  isrc?: string;
  title?: string;
  artist?: string;
  album?: string;
  year?: string | number | null;
  duration?: string;
  discogs_url?: string;
  spotify_url?: string;
  release_id?: string;
  local_tags?: string | undefined;
  notes?: string | undefined | null;
  bpm?: number | null;
  key?: string | undefined | null;
  danceability?: number | null;
  apple_music_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
  star_rating?: number;
  duration_seconds?: number | null;
  friend_id: number;
  local_audio_url?: string | null;
}

export type TrackEditFormState = {
  track_id: string;
  album: string;
  title: string;
  artist: string;
  local_tags: string;
  notes: string;
  bpm: string;
  key: string;
  danceability: string;
  apple_music_url: string;
  youtube_url: string;
  soundcloud_url: string;
  star_rating: number;
  duration_seconds?: number;
  friend_id?: number;
};

export type TrackForSearch = Pick<
  TrackEditFormProps,
  "track_id" | "year" | "duration" | "isrc" | "release_id" | "discogs_url" | "spotify_url"
> | null;

export function toTrackEditFormState(
  track: TrackEditFormProps | null
): TrackEditFormState {
  return {
    track_id: track?.track_id || "",
    album: track?.album || "",
    title: track?.title || "",
    artist: track?.artist || "",
    local_tags: (track?.local_tags as string | undefined) || "",
    notes: (track?.notes as string | undefined) || "",
    bpm: (track?.bpm as string | undefined) || "",
    key: (track?.key as string | undefined) || "",
    danceability: (track?.danceability as string | undefined) || "",
    apple_music_url: track?.apple_music_url || "",
    youtube_url: track?.youtube_url || "",
    soundcloud_url: track?.soundcloud_url || "",
    star_rating: typeof track?.star_rating === "number" ? track.star_rating : 0,
    duration_seconds: track?.duration_seconds || undefined,
    friend_id: track?.friend_id,
  };
}
