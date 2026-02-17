import { getRedisConnection } from "@/lib/redis";
import { v4 as uuidv4 } from "uuid";
import { Pool } from "pg";

export interface DownloadJobData {
  job_id: string;
  track_id: string;
  friend_id: number;
  release_id?: string | null;
  job_type?:
    | "download"
    | "fix-duration"
    | "extract-cover-art"
    | "extract-cover-art-album"
    | "analyze-local";
  apple_music_url?: string;
  spotify_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
  title?: string | null;
  artist?: string | null;
  preferred_downloader?: "freyr" | "spotdl" | "yt-dlp" | "scdl";
  local_audio_url?: string | null;
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
  name?: string;
  job_type?: DownloadJobData["job_type"];
  track_id: string;
  friend_id: number;
  release_id?: string | null;
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

  private async listJobKeys(): Promise<string[]> {
    const keys: string[] = [];
    let cursor = "0";
    do {
      const [nextCursor, batch] = await this.redis.scan(
        cursor,
        "MATCH",
        "job:*",
        "COUNT",
        1000
      );
      cursor = nextCursor;
      if (batch.length > 0) keys.push(...batch);
    } while (cursor !== "0");
    return keys;
  }

  private parseJobHash(jobData: Record<string, string>): JobStatus | null {
    if (!jobData || Object.keys(jobData).length === 0) return null;
    return {
      job_id: jobData.job_id,
      status: jobData.status as JobStatus["status"],
      progress: parseInt(jobData.progress || "0"),
      created_at: parseInt(jobData.created_at),
      updated_at: parseInt(jobData.updated_at),
      name: jobData.name,
      job_type: jobData.job_type as DownloadJobData["job_type"] | undefined,
      track_id: jobData.track_id,
      friend_id: parseInt(jobData.friend_id),
      release_id: jobData.release_id || null,
      error: jobData.error,
      result: jobData.result ? JSON.parse(jobData.result) : undefined,
    };
  }

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
      job_type: "download",
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
      name: "download-audio",
      job_type: "download",
      release_id: data.release_id || "",
    });

    // Add job to simple Redis queue (will be picked up by Python worker)
    await this.redis.lpush("download_queue", JSON.stringify(jobData));

    console.log(`Created download job ${job_id} for track ${data.track_id}`);
    return job_id;
  }

  async createDurationJob(data: {
    track_id: string;
    friend_id: number;
    local_audio_url?: string | null;
  }): Promise<string> {
    const job_id = uuidv4();
    const now = Date.now();

    await this.redis.hset(`job:${job_id}`, {
      job_id,
      status: "queued",
      progress: 0,
      created_at: now,
      updated_at: now,
      track_id: data.track_id,
      friend_id: data.friend_id,
      name: "fix-duration",
      job_type: "fix-duration",
    });

    const jobData: DownloadJobData = {
      job_id,
      job_type: "fix-duration",
      track_id: data.track_id,
      friend_id: data.friend_id,
      ...(data.local_audio_url ? { local_audio_url: data.local_audio_url } : {}),
    };

    await this.redis.lpush("download_queue", JSON.stringify(jobData));
    console.log(`Created duration job ${job_id} for track ${data.track_id}`);
    return job_id;
  }

  async createCoverArtJob(data: {
    track_id: string;
    friend_id: number;
    local_audio_url?: string | null;
  }): Promise<string> {
    const job_id = uuidv4();
    const now = Date.now();

    await this.redis.hset(`job:${job_id}`, {
      job_id,
      status: "queued",
      progress: 0,
      created_at: now,
      updated_at: now,
      track_id: data.track_id,
      friend_id: data.friend_id,
      name: "extract-cover-art",
      job_type: "extract-cover-art",
    });

    const jobData: DownloadJobData = {
      job_id,
      job_type: "extract-cover-art",
      track_id: data.track_id,
      friend_id: data.friend_id,
      ...(data.local_audio_url ? { local_audio_url: data.local_audio_url } : {}),
    };

    await this.redis.lpush("download_queue", JSON.stringify(jobData));
    console.log(`Created cover-art job ${job_id} for track ${data.track_id}`);
    return job_id;
  }

  async createCoverArtAlbumJob(data: {
    track_id: string;
    friend_id: number;
    release_id: string;
  }): Promise<string> {
    const job_id = uuidv4();
    const now = Date.now();

    await this.redis.hset(`job:${job_id}`, {
      job_id,
      status: "queued",
      progress: 0,
      created_at: now,
      updated_at: now,
      track_id: data.track_id,
      friend_id: data.friend_id,
      release_id: data.release_id,
      name: "extract-cover-art-album",
      job_type: "extract-cover-art-album",
    });

    const jobData: DownloadJobData = {
      job_id,
      job_type: "extract-cover-art-album",
      track_id: data.track_id,
      friend_id: data.friend_id,
      release_id: data.release_id,
    };

    await this.redis.lpush("download_queue", JSON.stringify(jobData));
    console.log(
      `Created album cover-art job ${job_id} for release ${data.release_id}`
    );
    return job_id;
  }

  async createAnalyzeLocalJob(data: {
    track_id: string;
    friend_id: number;
    local_audio_url?: string | null;
  }): Promise<string> {
    const job_id = uuidv4();
    const now = Date.now();

    await this.redis.hset(`job:${job_id}`, {
      job_id,
      status: "queued",
      progress: 0,
      created_at: now,
      updated_at: now,
      track_id: data.track_id,
      friend_id: data.friend_id,
      name: "analyze-local-audio",
      job_type: "analyze-local",
    });

    const jobData: DownloadJobData = {
      job_id,
      job_type: "analyze-local",
      track_id: data.track_id,
      friend_id: data.friend_id,
      ...(data.local_audio_url ? { local_audio_url: data.local_audio_url } : {}),
    };

    await this.redis.lpush("download_queue", JSON.stringify(jobData));
    console.log(`Created analyze-local job ${job_id} for track ${data.track_id}`);
    return job_id;
  }

  async getJobStatus(job_id: string): Promise<JobStatus | null> {
    const jobData = await this.redis.hgetall(`job:${job_id}`);
    return this.parseJobHash(jobData);
  }

  async getAllJobs(limit?: number): Promise<JobStatus[]> {
    const keys = await this.listJobKeys();
    const jobs: JobStatus[] = [];

    if (keys.length === 0) return jobs;

    const pipeline = this.redis.pipeline();
    for (const key of keys) {
      pipeline.hgetall(key);
    }

    const results = await pipeline.exec();
    if (!results) return jobs;

    for (const [err, value] of results) {
      if (err) continue;
      const parsed = this.parseJobHash(value as Record<string, string>);
      if (parsed) jobs.push(parsed);
    }

    // Sort by updated_at desc
    const sorted = jobs.sort((a, b) => b.updated_at - a.updated_at);
    return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
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
    const jobKeys = await this.listJobKeys();
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
