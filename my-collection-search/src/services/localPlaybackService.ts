import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

type PlaybackState = 'idle' | 'playing' | 'paused' | 'stopped';

interface PlaybackStatus {
  state: PlaybackState;
  currentTrack: string | null;
  position: number;
  duration: number;
}

/**
 * LocalPlaybackService - Manages server-side audio playback through ALSA/USB DAC
 *
 * Uses ffmpeg to play audio files through the configured ALSA device.
 * This allows high-quality audio output through USB DACs while the web UI controls playback.
 */
class LocalPlaybackService {
  private ffmpegProcess: ChildProcess | null = null;
  private currentState: PlaybackState = 'idle';
  private currentTrackPath: string | null = null;
  private audioDevice: string;
  private isEnabled: boolean;

  constructor() {
    this.audioDevice = process.env.AUDIO_DEVICE || 'default';
    this.isEnabled = process.env.ENABLE_AUDIO_PLAYBACK === 'true';
  }

  /**
   * Check if local playback is enabled via environment variables
   */
  isLocalPlaybackEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Play an audio file through the local DAC
   * @param filename - The filename in the audio directory
   */
  async play(filename: string): Promise<void> {
    if (!this.isEnabled) {
      throw new Error('Local playback is not enabled. Set ENABLE_AUDIO_PLAYBACK=true in .env');
    }

    // Stop any existing playback
    this.stop();

    const audioDir = path.resolve('audio');
    const filePath = path.join(audioDir, filename);

    // Validate file exists
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      throw new Error(`Audio file not found: ${filename}`);
    }

    this.currentTrackPath = filePath;
    this.currentState = 'playing';

    // Spawn ffmpeg process (better than ffplay for server-side playback)
    // -re: Read input at native frame rate (important for real-time playback)
    // -i: Input file
    // -vn: Disable video (audio-only)
    // -f alsa: ALSA output format
    // plughw: ALSA plugin that provides automatic format conversion
    const device = `plughw:${this.audioDevice || '1,0'}`;
    const args = [
      '-re',
      '-i', filePath,
      '-vn',
      '-f', 'alsa',
      device,
    ];

    console.log('[LocalPlayback] Starting ffmpeg with args:', args);
    console.log('[LocalPlayback] Device:', device, '| File:', filePath);

    this.ffmpegProcess = spawn('ffmpeg', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Log stderr for debugging
    this.ffmpegProcess.stderr?.on('data', (data) => {
      console.error('[ffmpeg stderr]:', data.toString());
    });

    this.ffmpegProcess.stdout?.on('data', (data) => {
      console.log('[ffmpeg stdout]:', data.toString());
    });

    this.ffmpegProcess.on('spawn', () => {
      console.log('[LocalPlayback] ffmpeg process spawned successfully');
    });

    this.ffmpegProcess.on('close', (code: number | null) => {
      console.log('[LocalPlayback] ffmpeg process closed with code:', code);
      if (code === 0) {
        // Normal exit - track finished
        this.currentState = 'idle';
        this.currentTrackPath = null;
      }
      this.ffmpegProcess = null;
    });

    this.ffmpegProcess.on('error', (err: Error) => {
      console.error('[LocalPlayback] ffmpeg process error:', err);
      this.currentState = 'stopped';
      this.ffmpegProcess = null;
    });
  }

  /**
   * Pause playback (sends SIGSTOP to ffmpeg process)
   */
  pause(): void {
    if (this.ffmpegProcess && this.currentState === 'playing') {
      this.ffmpegProcess.kill('SIGSTOP');
      this.currentState = 'paused';
    }
  }

  /**
   * Resume playback (sends SIGCONT to ffmpeg process)
   */
  resume(): void {
    if (this.ffmpegProcess && this.currentState === 'paused') {
      this.ffmpegProcess.kill('SIGCONT');
      this.currentState = 'playing';
    }
  }

  /**
   * Stop playback completely
   */
  stop(): void {
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGTERM');
      this.ffmpegProcess = null;
    }
    this.currentState = 'stopped';
    this.currentTrackPath = null;
  }

  /**
   * Get current playback status
   */
  getStatus(): PlaybackStatus {
    return {
      state: this.currentState,
      currentTrack: this.currentTrackPath ? path.basename(this.currentTrackPath) : null,
      position: 0, // ffplay doesn't easily expose position, would need parsing stderr
      duration: 0,
    };
  }

  /**
   * Test if ffmpeg is available
   */
  async testPlayback(): Promise<{ success: boolean; error?: string }> {
    if (!this.isEnabled) {
      return { success: false, error: 'Local playback is not enabled' };
    }

    return new Promise((resolve) => {
      const testProcess = spawn('ffmpeg', ['-version'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: 'ffmpeg exited with non-zero code' });
        }
      });

      testProcess.on('error', (err) => {
        resolve({ success: false, error: `ffmpeg not found: ${err.message}` });
      });
    });
  }
}

// Singleton instance
export const localPlaybackService = new LocalPlaybackService();
