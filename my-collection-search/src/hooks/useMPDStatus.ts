import { useState, useEffect } from 'react';

interface MPDStatus {
  position: number;
  duration: number;
  state: 'idle' | 'playing' | 'paused' | 'stopped';
}

/**
 * Poll MPD for current playback status
 * Used to sync server-side DAC playback with UI
 */
export function useMPDStatus(enabled: boolean, pollingInterval = 1000): MPDStatus {
  const [status, setStatus] = useState<MPDStatus>({
    position: 0,
    duration: 0,
    state: 'idle',
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let mounted = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/playback/local');
        if (!res.ok) return;

        const data = await res.json();
        if (!mounted) return;

        if (data.status) {
          setStatus({
            position: data.status.position || 0,
            duration: data.status.duration || 0,
            state: data.status.state || 'idle',
          });
        }
      } catch (error) {
        console.error('[useMPDStatus] Failed to fetch status:', error);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll for updates
    const interval = setInterval(fetchStatus, pollingInterval);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [enabled, pollingInterval]);

  return status;
}
