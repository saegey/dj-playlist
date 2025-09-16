import { Queue, QueueEvents } from "bullmq";
import { getRedisConnection } from "@/lib/redis";

export type PreferredDownloader = "freyr" | "spotdl" | "yt-dlp" | "scdl";

export interface DownloadAudioJobData {
  track_id: string;
  friend_id: number;
  apple_music_url?: string;
  spotify_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
  preferred_downloader?: PreferredDownloader;
}

export interface AnalyzeAudioJobData {
  track_id: string;
  friend_id: number;
  wavFileName: string;
  audioFileName: string;
}

// Queue names
export const QUEUE_NAMES = {
  DOWNLOAD_AUDIO: "download-audio",
  ANALYZE_AUDIO: "analyze-audio",
} as const;

export type QueueType = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Job priorities
export const JOB_PRIORITIES = {
  HIGH: 1,
  NORMAL: 10,
  LOW: 20,
} as const;

let downloadQueue: Queue<DownloadAudioJobData> | null = null;
let analyzeQueue: Queue<AnalyzeAudioJobData> | null = null;
let downloadEvents: QueueEvents | null = null;
let analyzeEvents: QueueEvents | null = null;

export function getDownloadQueue(): Queue<DownloadAudioJobData> {
  if (!downloadQueue) {
    const connection = getRedisConnection();
    downloadQueue = new Queue<DownloadAudioJobData>(
      QUEUE_NAMES.DOWNLOAD_AUDIO,
      {
        connection,
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        },
      }
    );
  }
  return downloadQueue;
}

export function getAnalyzeQueue(): Queue<AnalyzeAudioJobData> {
  if (!analyzeQueue) {
    const connection = getRedisConnection();
    analyzeQueue = new Queue<AnalyzeAudioJobData>(QUEUE_NAMES.ANALYZE_AUDIO, {
      connection,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    });
  }
  return analyzeQueue;
}

export function getDownloadEvents(): QueueEvents {
  if (!downloadEvents) {
    const connection = getRedisConnection();
    downloadEvents = new QueueEvents(QUEUE_NAMES.DOWNLOAD_AUDIO, {
      connection,
    });
  }
  return downloadEvents;
}

export function getAnalyzeEvents(): QueueEvents {
  if (!analyzeEvents) {
    const connection = getRedisConnection();
    analyzeEvents = new QueueEvents(QUEUE_NAMES.ANALYZE_AUDIO, { connection });
  }
  return analyzeEvents;
}

export async function addDownloadJob(
  data: DownloadAudioJobData,
  priority: number = JOB_PRIORITIES.NORMAL
): Promise<string> {
  console.log(`[AudioQueue] Adding download job for track ${data.track_id} with priority ${priority} and preferred downloader ${data.preferred_downloader}`);
  const queue = getDownloadQueue();
  const job = await queue.add("download-audio", data, {
    priority,
    delay: 0,
  });
  console.log(`[AudioQueue] Download job queued with ID: ${job.id}`);
  return job.id!;
}

export async function addAnalyzeJob(
  data: AnalyzeAudioJobData,
  priority: number = JOB_PRIORITIES.NORMAL
): Promise<string> {
  const queue = getAnalyzeQueue();
  const job = await queue.add("analyze-audio", data, {
    priority,
    delay: 0,
  });
  return job.id!;
}

export async function getJobStatus(jobId: string, queueName: string) {
  const queue =
    queueName === QUEUE_NAMES.DOWNLOAD_AUDIO
      ? getDownloadQueue()
      : getAnalyzeQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    name: job.name,
    data: job.data,
    progress: job.progress,
    returnvalue: job.returnvalue,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
    opts: job.opts,
    attemptsMade: job.attemptsMade,
    processedOn: job.processedOn,
    state: await job.getState(),
  };
}

export async function closeQueues(): Promise<void> {
  const promises: Promise<void>[] = [];

  if (downloadQueue) {
    promises.push(downloadQueue.close());
    downloadQueue = null;
  }

  if (analyzeQueue) {
    promises.push(analyzeQueue.close());
    analyzeQueue = null;
  }

  if (downloadEvents) {
    promises.push(downloadEvents.close());
    downloadEvents = null;
  }

  if (analyzeEvents) {
    promises.push(analyzeEvents.close());
    analyzeEvents = null;
  }

  await Promise.all(promises);
}
