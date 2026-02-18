import { AnalysisResult } from "./analysisService";

export interface JobInfo {
  id: string;
  name: string;
  state: string;
  progress: number;
  data: {
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
  returnvalue?: AnalysisResult;
  finishedOn?: number;
  failedReason?: string;
  attemptsMade: number;
  processedOn?: number;
  queue: string;
}

export interface JobsResponse {
  jobs: JobInfo[];
  summary: {
    total: number;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  pagination?: {
    limit: number;
    offset: number;
    total_filtered: number;
    has_more: boolean;
  };
}

export type FetchJobsOptions = {
  limit?: number;
  offset?: number;
  state?: "all" | "waiting" | "active" | "completed" | "failed";
};

export async function fetchJobs(options: FetchJobsOptions = {}): Promise<JobsResponse> {
  const params = new URLSearchParams();
  if (typeof options.limit === "number") params.set("limit", String(options.limit));
  if (typeof options.offset === "number") params.set("offset", String(options.offset));
  if (options.state) params.set("state", options.state);
  const query = params.toString();
  const response = await fetch(`/api/jobs${query ? `?${query}` : ""}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

export async function clearAllJobs(): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/jobs", {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
