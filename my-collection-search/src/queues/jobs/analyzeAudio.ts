import { Job, Worker } from "bullmq";
import { AnalysisService } from "@/services/analysisService";
import { AudioService } from "@/services/audioService";
import { type AnalyzeAudioJobData, QUEUE_NAMES } from "../audioQueue";
import { getRedisConnection } from "@/lib/redis";
import path from "path";

export async function processAnalyzeAudio(job: Job<AnalyzeAudioJobData>) {
  const { track_id, friend_id, wavFileName, audioFileName } = job.data;

  console.log(`Processing analysis job for track ${track_id}`);

  try {
    // Update progress
    await job.updateProgress(10);

    const analysisService = new AnalysisService();
    const audioService = new AudioService();

    // Analyze the audio file
    await job.updateProgress(30);
    const analysisResult = await analysisService.analyzeAudio(wavFileName);

    await job.updateProgress(70);

    // Update database and search index
    await analysisService.updateTrackInDatabase(
      track_id,
      friend_id,
      audioFileName,
      analysisResult
    );

    await job.updateProgress(90);

    // Clean up the temporary wav file
    const wavPath = path.join(process.cwd(), "audio", wavFileName);
    await audioService.cleanupWavFile(wavPath);

    await job.updateProgress(100);

    console.log(`Analysis completed for track ${track_id}`);

    return {
      success: true,
      analysisResult,
      local_audio_url: audioFileName,
    };
  } catch (error) {
    console.error(`Analysis failed for track ${track_id}:`, error);

    // Still try to clean up the wav file on error
    try {
      const audioService = new AudioService();
      const wavPath = path.join(process.cwd(), "audio", wavFileName);
      await audioService.cleanupWavFile(wavPath);
    } catch (cleanupError) {
      console.error("Failed to cleanup wav file on error:", cleanupError);
    }

    throw error;
  }
}

export function createAnalyzeWorker(): Worker {
  const connection = getRedisConnection();

  return new Worker(
    QUEUE_NAMES.ANALYZE_AUDIO,
    processAnalyzeAudio,
    {
      connection,
      concurrency: 3, // Process 3 analysis jobs concurrently
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 50 },
    }
  );
}