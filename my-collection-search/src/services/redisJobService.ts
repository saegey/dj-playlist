import { getRedisConnection } from "@/lib/redis";
import { v4 as uuidv4 } from "uuid";
import { Pool } from "pg";

export interface DownloadJobData {
  job_id: string;
  track_id: string;
  friend_id: number;
  apple_music_url?: string;
  spotify_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
  preferred_downloader?: "freyr" | "spotdl" | "yt-dlp" | "scdl";
  // Gamdl-specific settings
  quality?: "best" | "high" | "standard" | "lossless";
  format?: "m4a" | "mp3" | "aac" | "flac";
  save_cover?: boolean;
  cover_format?: "jpg" | "png" | "raw";
  save_lyrics?: boolean;
  lyrics_format?: "lrc" | "srt" | "ttml";
  overwrite_existing?: boolean;
  skip_music_videos?: boolean;
  max_retries?: number;
}

export interface JobStatus {
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
    [key: string]: unknown;
  };
}

export interface JobSummary {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
}

export class RedisJobService {
  private redis = getRedisConnection();

  /**
   * Fetch gamdl settings for a friend, creating defaults if not exists
   */
  private async getGamdlSettings(friendId: number) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
      // Ensure settings exist (create with defaults if not)
      await pool.query(`
        INSERT INTO gamdl_settings (friend_id)
        VALUES ($1)
        ON CONFLICT (friend_id) DO NOTHING
      `, [friendId]);

      // Get the settings
      const result = await pool.query(`
        SELECT audio_quality as quality, audio_format as format,
               save_cover, cover_format, save_lyrics, lyrics_format,
               overwrite_existing, skip_music_videos, max_retries
        FROM gamdl_settings
        WHERE friend_id = $1
      `, [friendId]);

      return result.rows[0] || {};
    } catch (error) {
      console.error(`Failed to fetch gamdl settings for friend ${friendId}:`, error);
      // Return defaults if database fails
      return {
        quality: 'best',
        format: 'm4a',
        save_cover: false,
        cover_format: 'jpg',
        save_lyrics: false,
        lyrics_format: 'lrc',
        overwrite_existing: false,
        skip_music_videos: true,
        max_retries: 3
      };
    } finally {
      await pool.end();
    }
  }

  async createDownloadJob(
    data: Omit<DownloadJobData, "job_id">
  ): Promise<string> {
    const job_id = uuidv4();

    // Fetch gamdl settings for the friend if not already provided
    const gamdlSettings = data.friend_id ? await this.getGamdlSettings(data.friend_id) : {};

    // Merge provided data with fetched settings (provided data takes precedence)
    const jobData: DownloadJobData = {
      ...gamdlSettings,
      ...data,
      job_id,
    };

    const now = Date.now();

    // Store job metadata
    await this.redis.hset(`job:${job_id}`, {
      job_id,
      status: "queued",
      progress: 0,
      created_at: now,
      updated_at: now,
      track_id: data.track_id,
      friend_id: data.friend_id,
    });

    // Add job to simple Redis queue (will be picked up by Python worker)
    await this.redis.lpush("download_queue", JSON.stringify(jobData));

    console.log(`Created download job ${job_id} for track ${data.track_id}`);
    return job_id;
  }

  async getJobStatus(job_id: string): Promise<JobStatus | null> {
    const jobData = await this.redis.hgetall(`job:${job_id}`);

    if (!jobData || Object.keys(jobData).length === 0) {
      return null;
    }

    return {
      job_id: jobData.job_id,
      status: jobData.status as JobStatus["status"],
      progress: parseInt(jobData.progress || "0"),
      created_at: parseInt(jobData.created_at),
      updated_at: parseInt(jobData.updated_at),
      track_id: jobData.track_id,
      friend_id: parseInt(jobData.friend_id),
      error: jobData.error,
      result: jobData.result ? JSON.parse(jobData.result) : undefined,
    };
  }

  async getAllJobs(limit: number = 100): Promise<JobStatus[]> {
    const keys = await this.redis.keys("job:*");
    const jobs: JobStatus[] = [];

    for (const key of keys.slice(0, limit)) {
      const jobData = await this.redis.hgetall(key);
      if (jobData && Object.keys(jobData).length > 0) {
        jobs.push({
          job_id: jobData.job_id,
          status: jobData.status as JobStatus["status"],
          progress: parseInt(jobData.progress || "0"),
          created_at: parseInt(jobData.created_at),
          updated_at: parseInt(jobData.updated_at),
          track_id: jobData.track_id,
          friend_id: parseInt(jobData.friend_id),
          error: jobData.error,
          result: jobData.result ? JSON.parse(jobData.result) : undefined,
        });
      }
    }

    // Sort by updated_at desc
    return jobs.sort((a, b) => b.updated_at - a.updated_at);
  }

  async getJobSummary(): Promise<JobSummary> {
    const jobs = await this.getAllJobs();

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

  async clearAllJobs(): Promise<void> {
    // Clear job data
    const jobKeys = await this.redis.keys("job:*");
    if (jobKeys.length > 0) {
      await this.redis.del(...jobKeys);
    }

    // Clear queues
    await this.redis.del("download_queue");

    console.log(`Cleared ${jobKeys.length} jobs and queues`);
  }

  async deleteJob(job_id: string): Promise<boolean> {
    const deleted = await this.redis.del(`job:${job_id}`);
    return deleted > 0;
  }
}

export const redisJobService = new RedisJobService();
