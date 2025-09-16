import { PreferredDownloader } from "@/queues/audioQueue";

export interface AsyncAnalyzeArgs {
  track_id: string;
  friend_id: number;
  apple_music_url?: string;
  spotify_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
  preferred_downloader?: PreferredDownloader;
}

export interface AsyncAnalyzeResponse {
  success: boolean;
  jobId: string;
  message: string;
}

export interface JobStatusResponse {
  id: string;
  name: string;
  state: string;
  progress: number;
  data: unknown;
  returnvalue?: unknown;
  finishedOn?: number;
  failedReason?: string;
  attemptsMade: number;
  processedOn?: number;
}

export async function analyzeTrackAsync(
  args: AsyncAnalyzeArgs
): Promise<AsyncAnalyzeResponse> {
  const response = await fetch("/api/tracks/analyze-async", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getJobStatus(
  jobId: string,
  queue?: string
): Promise<JobStatusResponse> {
  const url = new URL(
    `/api/tracks/job-status/${jobId}`,
    window.location.origin
  );
  if (queue) {
    url.searchParams.set("queue", queue);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export function createJobEventSource(
  jobId: string,
  queue?: string
): EventSource {
  const url = new URL(
    `/api/tracks/job-events/${jobId}`,
    window.location.origin
  );
  if (queue) {
    url.searchParams.set("queue", queue);
  }

  return new EventSource(url.toString());
}
