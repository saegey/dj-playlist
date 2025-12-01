import { AnalysisResult } from "./analysisService";

export interface JobInfo {
  id: string;
  name: string;
  state: string;
  progress: number;
  data: {
    track_id: string;
    friend_id: number;
    apple_music_url?: string;
    spotify_url?: string;
    youtube_url?: string;
    soundcloud_url?: string;
    title?: string | null;
    artist?: string | null;
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
}

export async function fetchJobs(): Promise<JobsResponse> {
  const response = await fetch("/api/jobs");

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
