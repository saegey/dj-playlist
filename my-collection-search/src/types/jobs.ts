export type JobData = {
  track_id: string;
  friend_id: number;
  release_id?: string | null;
  job_type?: string;
  apple_music_url?: string;
  spotify_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
  title?: string | null;
  artist?: string | null;
  album?: string | null;
  year?: string | number | null;
  album_thumbnail?: string | null;
  discogs_url?: string | null;
  local_audio_url?: string | null;
  library_identifier?: string | null;
  username?: string | null;
};

export interface JobInfo {
  id: string;
  name: string;
  state: string;
  progress: number;
  data: JobData;
  returnvalue?: unknown;
  finishedOn?: number;
  failedReason?: string;
  attemptsMade: number;
  processedOn?: number;
  queue: string;
}
