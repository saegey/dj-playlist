import type { JobInfo } from "@/types/jobs";

export type JobStatus = {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  created_at: number;
  updated_at: number;
  track_id: string;
  friend_id: number;
  error?: string;
  result?: {
    file_path?: string;
    file_url?: string;
    duration?: number;
    format?: string;
    success?: boolean;
    local_audio_url?: string;
    [key: string]: unknown;
  };
};

export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
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
