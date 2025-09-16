import { Job, Worker } from "bullmq";
import { AudioService } from "@/services/audioService";
import {
  addAnalyzeJob,
  type DownloadAudioJobData,
  QUEUE_NAMES,
} from "../audioQueue";
import { getRedisConnection } from "@/lib/redis";

export async function processDownloadAudio(job: Job<DownloadAudioJobData>) {
  const {
    track_id,
    friend_id,
    apple_music_url,
    spotify_url,
    youtube_url,
    soundcloud_url,
    preferred_downloader,
  } = job.data;

  console.log(
    `[DownloadWorker] Processing download job ${job.id} for track ${track_id} with preferred downloader ${preferred_downloader}`
  );
  console.log(`[DownloadWorker] Available URLs:`, {
    apple_music_url: !!apple_music_url,
    spotify_url: !!spotify_url,
    youtube_url: !!youtube_url,
    soundcloud_url: !!soundcloud_url,
  });

  try {
    // Update progress
    await job.updateProgress(10);
    console.log(
      `[DownloadWorker] Job ${job.id} - Progress: 10% (Starting download)`
    );

    const audioService = new AudioService();

    // Download and convert audio
    await job.updateProgress(30);
    console.log(
      `[DownloadWorker] Job ${job.id} - Progress: 30% (Downloading audio)`
    );

    const result = await audioService.downloadAndConvertAudio({
      apple_music_url,
      spotify_url,
      youtube_url,
      soundcloud_url,
      preferred_downloader,
    });

    await job.updateProgress(90);
    console.log(
      `[DownloadWorker] Job ${job.id} - Progress: 90% (Audio downloaded, queueing analysis)`
    );

    // Queue the analysis job
    const analyzeJobId = await addAnalyzeJob({
      track_id,
      friend_id,
      wavFileName: result.wavFileName,
      audioFileName: result.audioFileName,
    });

    await job.updateProgress(100);
    console.log(`[DownloadWorker] Job ${job.id} - Progress: 100% (Complete)`);
    console.log(
      `[DownloadWorker] Download completed for track ${track_id}, queued analysis job ${analyzeJobId}`
    );

    return {
      success: true,
      audioFileName: result.audioFileName,
      wavFileName: result.wavFileName,
      analyzeJobId,
    };
  } catch (error) {
    console.error(
      `[DownloadWorker] Download failed for track ${track_id}:`,
      error
    );
    throw error;
  }
}

export function createDownloadWorker(): Worker {
  const connection = getRedisConnection();

  return new Worker(QUEUE_NAMES.DOWNLOAD_AUDIO, processDownloadAudio, {
    connection,
    concurrency: 5, // Increased to 5 downloads concurrently
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 50 },
  });
}
