import { execSync } from 'child_process';

/**
 * AirPlayControlService - Manages coordination between app playback and AirPlay
 *
 * When the app wants to play audio, it needs to interrupt AirPlay by stopping
 * the shairport-sync container. This ensures exclusive hardware access to the DAC.
 */
class AirPlayControlService {
  private isEnabled: boolean;
  private containerName: string;

  constructor() {
    // Only enable if AirPlay auto-pause is configured
    this.isEnabled = process.env.AIRPLAY_AUTO_PAUSE === 'true';
    this.containerName = 'shairport-sync';
  }

  /**
   * Check if AirPlay control is enabled
   */
  isAirPlayControlEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Check if shairport-sync container is running
   */
  isAirPlayRunning(): boolean {
    if (!this.isEnabled) {
      return false;
    }

    try {
      const result = execSync(
        `docker ps --filter name=${this.containerName} --filter status=running --format '{{.Names}}'`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      return result.trim() === this.containerName;
    } catch (error) {
      console.error('[AirPlay] Error checking container status:', error);
      return false;
    }
  }

  /**
   * Stop the shairport-sync container to interrupt AirPlay
   * This allows the app to take exclusive control of the DAC
   */
  async stopAirPlay(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      const isRunning = this.isAirPlayRunning();

      if (!isRunning) {
        console.log('[AirPlay] Container not running, nothing to stop');
        return;
      }

      console.log('[AirPlay] Stopping shairport-sync to take over DAC...');
      execSync(`docker stop ${this.containerName}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      console.log('[AirPlay] Stopped shairport-sync');
    } catch (error) {
      // Don't throw - if we can't stop AirPlay, app playback might still work
      // (depends on which service has the hardware lock)
      console.error('[AirPlay] Failed to stop shairport-sync:', error);
    }
  }

  /**
   * Start the shairport-sync container to restore AirPlay functionality
   * This releases app control of the DAC and allows AirPlay to connect
   */
  async startAirPlay(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      const isRunning = this.isAirPlayRunning();

      if (isRunning) {
        console.log('[AirPlay] Container already running');
        return;
      }

      console.log('[AirPlay] Starting shairport-sync to restore AirPlay...');
      execSync(`docker start ${this.containerName}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      console.log('[AirPlay] Started shairport-sync');
    } catch (error) {
      console.error('[AirPlay] Failed to start shairport-sync:', error);
      throw error;
    }
  }

  /**
   * Check if AirPlay is currently playing audio
   * This is a best-effort check - we assume if the container is running,
   * it might be actively streaming
   */
  isAirPlayActive(): boolean {
    return this.isAirPlayRunning();
  }
}

// Singleton instance
export const airplayControlService = new AirPlayControlService();
