import { http } from "./http";

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

export type JobSummary = {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
};

export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  return await http<JobStatus | null>(`/api/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
  });
}

export async function getAllJobs(): Promise<JobStatus[]> {
  return await http<JobStatus[]>("/api/jobs", {
    method: "GET",
  });
}

export async function getJobSummary(): Promise<JobSummary> {
  const jobs = await getAllJobs();

  const summary: JobSummary = {
    total: jobs.length,
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  for (const job of jobs) {
    switch (job.status) {
      case "queued":
        summary.queued++;
        break;
      case "processing":
        summary.processing++;
        break;
      case "completed":
        summary.completed++;
        break;
      case "failed":
        summary.failed++;
        break;
    }
  }

  return summary;
}

export async function clearAllJobs(): Promise<void> {
  await http<void>("/api/jobs", {
    method: "DELETE",
  });
}

export async function deleteJob(jobId: string): Promise<void> {
  await http<void>(`/api/jobs/${encodeURIComponent(jobId)}`, {
    method: "DELETE",
  });
}