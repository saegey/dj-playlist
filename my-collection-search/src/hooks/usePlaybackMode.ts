import { useState, useCallback, useEffect } from 'react';
import type { PlaybackMode } from '@/components/PlaybackModeSelector';

const STORAGE_KEY = 'mcs:playbackMode';

/**
 * Hook to manage playback mode selection (browser vs local DAC)
 * Persists the user's preference to localStorage
 */
export function usePlaybackMode() {
  const [mode, setModeState] = useState<PlaybackMode>('browser');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'browser' || saved === 'local-dac') {
        setModeState(saved);
      }
    } catch (error) {
      console.error('Failed to load playback mode from localStorage:', error);
    }
  }, []);

  // Save to localStorage when changed
  const setMode = useCallback((newMode: PlaybackMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Failed to save playback mode to localStorage:', error);
    }
  }, []);

  return { mode, setMode };
}

/**
 * Hook to control local DAC playback via API
 */
export function useLocalPlayback() {
  const play = useCallback(async (filename: string) => {
    try {
      const res = await fetch('/api/playback/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'play', filename }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to play track');
      }

      return await res.json();
    } catch (error) {
      console.error('Local playback error:', error);
      throw error;
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      const res = await fetch('/api/playback/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to pause playback');
      }

      return await res.json();
    } catch (error) {
      console.error('Local playback pause error:', error);
      throw error;
    }
  }, []);

  const resume = useCallback(async () => {
    try {
      const res = await fetch('/api/playback/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to resume playback');
      }

      return await res.json();
    } catch (error) {
      console.error('Local playback resume error:', error);
      throw error;
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      const res = await fetch('/api/playback/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to stop playback');
      }

      return await res.json();
    } catch (error) {
      console.error('Local playback stop error:', error);
      throw error;
    }
  }, []);

  return { play, pause, resume, stop };
}
