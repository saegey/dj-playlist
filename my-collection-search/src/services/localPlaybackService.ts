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
 * Uses ffplay (from ffmpeg) to play audio files through the configured ALSA device.
 * This allows high-quality audio output through USB DACs while the web UI controls playback.
 */
class LocalPlaybackService {
  private ffplayProcess: ChildProcess | null = null;
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

    // Spawn ffplay process
    // -nodisp: No video display window
    // -autoexit: Exit when playback finishes
    // -loglevel error: Show errors but suppress verbose output
    // -af "aformat=sample_rates=44100|48000": Ensure compatible sample rate
    // -f alsa: Use ALSA output
    // -audio_device: Specify which ALSA device to use
    const args = [
      '-nodisp',
      '-autoexit',
      '-loglevel', 'error',
      '-af', 'aformat=sample_rates=44100|48000',
      '-f', 'alsa',
      '-audio_device', this.audioDevice || 'hw:1,0', // Always specify ALSA device
      '-i', filePath,
    ];

    this.ffplayProcess = spawn('ffplay', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.ffplayProcess.on('close', (code) => {
      if (code === 0) {
        // Normal exit - track finished
        this.currentState = 'idle';
        this.currentTrackPath = null;
      }
      this.ffplayProcess = null;
    });

    this.ffplayProcess.on('error', (err) => {
      console.error('ffplay error:', err);
      this.currentState = 'stopped';
      this.ffplayProcess = null;
    });
  }

  /**
   * Pause playback (sends SIGSTOP to ffplay process)
   */
  pause(): void {
    if (this.ffplayProcess && this.currentState === 'playing') {
      this.ffplayProcess.kill('SIGSTOP');
      this.currentState = 'paused';
    }
  }

  /**
   * Resume playback (sends SIGCONT to ffplay process)
   */
  resume(): void {
    if (this.ffplayProcess && this.currentState === 'paused') {
      this.ffplayProcess.kill('SIGCONT');
      this.currentState = 'playing';
    }
  }

  /**
   * Stop playback completely
   */
  stop(): void {
    if (this.ffplayProcess) {
      this.ffplayProcess.kill('SIGTERM');
      this.ffplayProcess = null;
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
   * Test if ffplay is available
   */
  async testPlayback(): Promise<{ success: boolean; error?: string }> {
    if (!this.isEnabled) {
      return { success: false, error: 'Local playback is not enabled' };
    }

    return new Promise((resolve) => {
      const testProcess = spawn('ffplay', ['-version'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: 'ffplay exited with non-zero code' });
        }
      });

      testProcess.on('error', (err) => {
        resolve({ success: false, error: `ffplay not found: ${err.message}` });
      });
    });
  }
}

// Singleton instance
export const localPlaybackService = new LocalPlaybackService();
