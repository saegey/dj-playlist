import { useState, useEffect } from 'react';

interface MPDStatus {
  position: number;
  duration: number;
  state: 'idle' | 'playing' | 'paused' | 'stopped';
}

/**
 * Stream MPD playback status via Server-Sent Events (SSE)
 * Much more efficient than polling - server pushes updates
 * Used to sync server-side DAC playback with UI
 */
export function useMPDStatus(enabled: boolean): MPDStatus {
  const [status, setStatus] = useState<MPDStatus>({
    position: 0,
    duration: 0,
    state: 'idle',
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    console.log('[useMPDStatus] Connecting to SSE stream');

    // Create EventSource for Server-Sent Events
    const eventSource = new EventSource('/api/playback/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStatus({
          position: data.position || 0,
          duration: data.duration || 0,
          state: data.state || 'idle',
        });
      } catch (error) {
        console.error('[useMPDStatus] Failed to parse SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[useMPDStatus] SSE error:', error);
      // EventSource will automatically reconnect
    };

    eventSource.onopen = () => {
      console.log('[useMPDStatus] SSE connection opened');
    };

    return () => {
      console.log('[useMPDStatus] Closing SSE connection');
      eventSource.close();
    };
  }, [enabled]);

  return status;
}
