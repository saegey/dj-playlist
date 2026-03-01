import { useState, useCallback, useEffect } from "react";
import type { PlaybackMode } from "@/components/PlaybackModeSelector";
import { controlLocalPlayback } from "@/services/internalApi/playback";

const STORAGE_KEY = "mcs:playbackMode";
const MODE_CHANGED_EVENT = "mcs:playbackModeChanged";

function isPlaybackMode(value: string | null): value is PlaybackMode {
  return value === "browser" || value === "local-dac";
}

/**
 * Hook to manage playback mode selection (browser vs local DAC)
 * Persists the user's preference to localStorage
 */
export function usePlaybackMode() {
  const [mode, setModeState] = useState<PlaybackMode>("browser");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isPlaybackMode(saved)) {
        setModeState(saved);
      }
    } catch (error) {
      console.error("Failed to load playback mode from localStorage:", error);
    }
  }, []);

  // Keep multiple hook instances in sync within the same tab and across tabs
  useEffect(() => {
    const onModeChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: PlaybackMode }>).detail;
      if (detail?.mode && isPlaybackMode(detail.mode)) {
        setModeState(detail.mode);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (isPlaybackMode(event.newValue)) {
        setModeState(event.newValue);
      }
    };

    window.addEventListener(MODE_CHANGED_EVENT, onModeChanged as EventListener);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(
        MODE_CHANGED_EVENT,
        onModeChanged as EventListener
      );
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Save to localStorage when changed
  const setMode = useCallback((newMode: PlaybackMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
      window.dispatchEvent(
        new CustomEvent(MODE_CHANGED_EVENT, { detail: { mode: newMode } })
      );
    } catch (error) {
      console.error("Failed to save playback mode to localStorage:", error);
    }
  }, []);

  return { mode, setMode };
}

/**
 * Hook to control local DAC playback via API
 */
export function useLocalPlayback() {
  const runAction = useCallback(
    async (body: Parameters<typeof controlLocalPlayback>[0]) => {
      try {
        return await controlLocalPlayback(body);
      } catch (error) {
        console.error("Local playback action error:", error);
        throw error;
      }
    },
    []
  );

  const play = useCallback(async (filename: string) => {
    try {
      return await runAction({ action: "play", filename });
    } catch (error) {
      console.error("Local playback error:", error);
      throw error;
    }
  }, [runAction]);

  const pause = useCallback(async () => {
    try {
      return await runAction({ action: "pause" });
    } catch (error) {
      console.error("Local playback pause error:", error);
      throw error;
    }
  }, [runAction]);

  const resume = useCallback(async () => {
    try {
      return await runAction({ action: "resume" });
    } catch (error) {
      console.error("Local playback resume error:", error);
      throw error;
    }
  }, [runAction]);

  const stop = useCallback(async () => {
    try {
      return await runAction({ action: "stop" });
    } catch (error) {
      console.error("Local playback stop error:", error);
      throw error;
    }
  }, [runAction]);

  const seek = useCallback(async (seconds: number) => {
    try {
      return await runAction({ action: "seek", seconds });
    } catch (error) {
      console.error("Local playback seek error:", error);
      throw error;
    }
  }, [runAction]);

  const setVolume = useCallback(async (volume: number) => {
    try {
      return await runAction({ action: "volume", volume });
    } catch (error) {
      console.error("Local playback volume error:", error);
      throw error;
    }
  }, [runAction]);

  return { play, pause, resume, stop, seek, setVolume };
}
