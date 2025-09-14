import { useTrackStore } from '@/stores/trackStore';
import type { Track } from '@/types/track';

/**
 * Hook to get a single track from the store
 */
export function useTrack(trackId: string, friendId: number): Track | undefined {
  return useTrackStore((state) => {
    const keyExact = `${trackId}:${friendId}`;
    const tExact = state.tracks.get(keyExact);
    if (tExact) return tExact;

    return undefined;
  });
}

/**
 * Hook to get multiple tracks from the store
 */
export function useTracks(trackIds: string[], friendId: number): Track[] {
  return useTrackStore((state) => 
    trackIds
      .map(id => {
        const key = `${id}:${friendId}`;
        return state.tracks.get(key);
      })
      .filter((track): track is Track => track !== undefined)
  );
}

/**
 * Hook to check if a track exists in the store
 */
export function useHasTrack(trackId: string, friendId: number): boolean {
  return useTrackStore((state) => {
    const key = `${trackId}:${friendId}`;
    return state.tracks.has(key);
  });
}