import { useTrackStore } from '@/stores/trackStore';
import type { Track } from '@/types/track';

/**
 * Hook to get a single track from the store
 */
export function useTrack(trackId: string, username?: string): Track | undefined {
  return useTrackStore((state) => {
    const normUser = username || 'default';
    const keyExact = `${trackId}:${normUser}`;
    const tExact = state.tracks.get(keyExact);
    if (tExact) return tExact;
    // Fallback: if exact username not found, try 'default'
    if (normUser !== 'default') {
      const keyDefault = `${trackId}:default`;
      const tDefault = state.tracks.get(keyDefault);
      if (tDefault) return tDefault;
    }
    return undefined;
  });
}

/**
 * Hook to get multiple tracks from the store
 */
export function useTracks(trackIds: string[], username?: string): Track[] {
  return useTrackStore((state) => 
    trackIds
      .map(id => {
        const key = `${id}:${username || 'default'}`;
        return state.tracks.get(key);
      })
      .filter((track): track is Track => track !== undefined)
  );
}

/**
 * Hook to check if a track exists in the store
 */
export function useHasTrack(trackId: string, username?: string): boolean {
  return useTrackStore((state) => {
    const key = `${trackId}:${username || 'default'}`;
    return state.tracks.has(key);
  });
}