import { Socket } from 'net';
import path from 'path';

type PlaybackState = 'idle' | 'playing' | 'paused' | 'stopped';

interface PlaybackStatus {
  state: PlaybackState;
  currentTrack: string | null;
  position: number;
  duration: number;
}

/**
 * LocalPlaybackService - Manages server-side audio playback through MPD
 *
 * Uses MPD (Music Player Daemon) for robust, professional audio playback.
 * MPD protocol is simple text-based TCP communication.
 */
class LocalPlaybackService {
  private socket: Socket | null = null;
  private isEnabled: boolean;
  private mpdHost: string;
  private mpdPort: number;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.isEnabled = process.env.ENABLE_AUDIO_PLAYBACK === 'true';
    this.mpdHost = process.env.MPD_HOST || 'mpd';
    this.mpdPort = parseInt(process.env.MPD_PORT || '6600', 10);
  }

  /**
   * Connect to MPD server
   */
  private async connect(): Promise<void> {
    if (this.socket && !this.socket.destroyed) {
      return; // Already connected
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const socket = new Socket();

      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error('MPD connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('[MPD] Connected to', this.mpdHost, this.mpdPort);
      });

      socket.on('data', (data) => {
        const response = data.toString();
        console.log('[MPD] <<', response.trim());

        if (response.startsWith('OK MPD')) {
          this.socket = socket;
          this.connectionPromise = null;
          resolve();
        }
      });

      socket.on('error', (error) => {
        clearTimeout(timeout);
        this.connectionPromise = null;
        console.error('[MPD] Connection error:', error);
        reject(error);
      });

      socket.on('close', () => {
        console.log('[MPD] Connection closed');
        this.socket = null;
        this.connectionPromise = null;
      });

      console.log('[MPD] Connecting to', this.mpdHost, this.mpdPort);
      socket.connect(this.mpdPort, this.mpdHost);
    });

    return this.connectionPromise;
  }

  /**
   * Send command to MPD and wait for response
   */
  private async sendCommand(command: string): Promise<string> {
    await this.connect();

    if (!this.socket) {
      throw new Error('Not connected to MPD');
    }

    const socket = this.socket; // Capture for use in promise

    return new Promise((resolve, reject) => {
      let response = '';

      const onData = (data: Buffer) => {
        const text = data.toString();
        response += text;

        // Check if response is complete
        if (text.includes('\nOK\n') || text.includes('\nACK')) {
          socket.removeListener('data', onData);

          if (text.includes('\nACK')) {
            const match = text.match(/ACK \[(\d+)@(\d+)\] \{([^}]+)\} (.+)/);
            const error = match ? match[4] : text;
            reject(new Error(`MPD error: ${error}`));
          } else {
            resolve(response);
          }
        }
      };

      socket.on('data', onData);

      console.log('[MPD] >>', command.trim());
      socket.write(command + '\n');

      // Timeout after 10 seconds
      setTimeout(() => {
        socket.removeListener('data', onData);
        reject(new Error('MPD command timeout'));
      }, 10000);
    });
  }

  /**
   * Check if local playback is enabled
   */
  isLocalPlaybackEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Play an audio file through MPD
   * @param filename - The filename in the audio directory
   */
  async play(filename: string): Promise<void> {
    if (!this.isEnabled) {
      throw new Error('Local playback is not enabled. Set ENABLE_AUDIO_PLAYBACK=true in .env');
    }

    try {
      console.log('[MPD] Playing:', filename);

      // Clear playlist, add track, and play
      await this.sendCommand('clear');
      await this.sendCommand(`add "${filename}"`);
      await this.sendCommand('play 0');

      console.log('[MPD] Playback started');
    } catch (error) {
      console.error('[MPD] Play error:', error);
      throw error;
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    try {
      await this.sendCommand('pause 1');
      console.log('[MPD] Paused');
    } catch (error) {
      console.error('[MPD] Pause error:', error);
      throw error;
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    try {
      await this.sendCommand('pause 0');
      console.log('[MPD] Resumed');
    } catch (error) {
      console.error('[MPD] Resume error:', error);
      throw error;
    }
  }

  /**
   * Stop playback
   */
  async stop(): Promise<void> {
    try {
      await this.sendCommand('stop');
      console.log('[MPD] Stopped');
    } catch (error) {
      console.error('[MPD] Stop error:', error);
      throw error;
    }
  }

  /**
   * Seek to a specific position
   */
  async seek(seconds: number): Promise<void> {
    try {
      await this.sendCommand(`seekcur ${seconds}`);
      console.log('[MPD] Seeked to', seconds, 'seconds');
    } catch (error) {
      console.error('[MPD] Seek error:', error);
      throw error;
    }
  }

  /**
   * Get current playback status
   */
  async getStatus(): Promise<PlaybackStatus> {
    try {
      const response = await this.sendCommand('status');
      const currentSongResponse = await this.sendCommand('currentsong');

      // Parse status response
      const parseValue = (key: string, text: string): string | null => {
        const match = text.match(new RegExp(`^${key}: (.+)$`, 'm'));
        return match ? match[1] : null;
      };

      const stateStr = parseValue('state', response);
      let state: PlaybackState = 'idle';
      if (stateStr === 'play') state = 'playing';
      else if (stateStr === 'pause') state = 'paused';
      else if (stateStr === 'stop') state = 'stopped';

      const file = parseValue('file', currentSongResponse);
      const elapsed = parseFloat(parseValue('elapsed', response) || '0');
      const duration = parseFloat(parseValue('duration', response) || '0');

      return {
        state,
        currentTrack: file ? path.basename(file) : null,
        position: elapsed,
        duration,
      };
    } catch (error) {
      console.error('[MPD] Status error:', error);
      return {
        state: 'idle',
        currentTrack: null,
        position: 0,
        duration: 0,
      };
    }
  }

  /**
   * Test if MPD is available
   */
  async testPlayback(): Promise<{ success: boolean; error?: string }> {
    if (!this.isEnabled) {
      return { success: false, error: 'Local playback is not enabled' };
    }

    try {
      await this.connect();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `MPD connection failed: ${error instanceof Error ? error.message : error}`,
      };
    }
  }

  /**
   * Disconnect from MPD
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }
}

// Singleton instance
export const localPlaybackService = new LocalPlaybackService();
