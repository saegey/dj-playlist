import { create } from 'zustand';
import type { Track } from '@/types/track';
import { diffObjectKeys, isStoreDebugEnabled, storeLog } from '@/lib/devLogger';

interface TrackStore {
  tracks: Map<string, Track>;
  setTrack: (track: Track) => void;
  setTracks: (tracks: Track[]) => void;
  updateTrack: (trackId: string, username: string, updates: Partial<Track>) => void;
  getTrack: (trackId: string, username?: string) => Track | undefined;
  hasTrack: (trackId: string, username?: string) => boolean;
  clearTracks: () => void;
  // internal: list of fields we preserve on setTracks to prevent stale seeds from clobbering local edits
  _preserveFields: Array<keyof Track>;
}

const createTrackKey = (trackId: string, username?: string): string => {
  return `${trackId}:${username || 'default'}`;
};

export const useTrackStore = create<TrackStore>((set, get) => ({
  tracks: new Map<string, Track>(),

  // Fields that are typically user-mutated locally and should not be clobbered
  // by background cache seeds (search results) unless explicitly updated.
  // Adjust this list as needed.
  // Note: server-confirmed updates should write via setTrack/updateTrack, not via setTracks.
  _preserveFields: [
    'star_rating',
    'notes',
    'bpm',
    'key',
    'local_tags',
    'danceability',
    'mood_happy',
    'mood_sad',
    'mood_relaxed',
    'mood_aggressive',
  ] as Array<keyof Track>,

  setTrack: (track: Track) => {
    set((state) => {
      const username = track.username || 'default';
      const key = createTrackKey(track.track_id, username);
      const prev = state.tracks.get(key);
      const newTracks = new Map(state.tracks);
      newTracks.set(key, track);

      if (isStoreDebugEnabled()) {
        storeLog('setTrack', [
          ['key', key],
          ['username', username],
          ['prev', prev],
          ['next', track],
          ['diff', diffObjectKeys(prev as unknown as Record<string, unknown>, track as unknown as Record<string, unknown>)],
        ]);
      }
      return { tracks: newTracks };
    });
  },

  setTracks: (tracks: Track[]) => {
    set((state) => {
      let hasChanges = false;
      const newTracks = new Map(state.tracks);
      
      tracks.forEach((track) => {
        const username = track.username || 'default';
        const key = createTrackKey(track.track_id, username);
        const existing = state.tracks.get(key);
        // Merge strategy: preserve selected fields from existing to avoid stale seeds clobbering local updates
        let nextValue: Track;
        if (existing) {
          const preserved: Partial<Track> = {};
          for (const f of get()._preserveFields) {
            // @ts-expect-error index by keyof Track
            preserved[f] = existing[f];
          }
          nextValue = { ...track, ...preserved } as Track;
          // If nothing actually changed after merge, skip write
          const diff = diffObjectKeys(existing as unknown as Record<string, unknown>, nextValue as unknown as Record<string, unknown>);
          const changed = Object.keys(diff).length > 0;
          if (changed) {
            newTracks.set(key, nextValue);
            hasChanges = true;
            if (isStoreDebugEnabled()) {
              storeLog('setTracks:item', [
                ['key', key],
                ['username', username],
                ['prev', existing],
                ['incoming', track],
                ['merged', nextValue],
                ['diff', diff],
              ]);
            }
          }
        } else {
          // New entry
          newTracks.set(key, track);
          hasChanges = true;
          if (isStoreDebugEnabled()) {
            storeLog('setTracks:item:new', [
              ['key', key],
              ['username', username],
              ['next', track],
            ]);
          }
        }
      });
      
      // Only return new state if there were actual changes
      if (hasChanges) {
        if (isStoreDebugEnabled()) {
          storeLog('setTracks:commit', [
            ['count', tracks.length],
          ]);
        }
        return { tracks: newTracks };
      }
      return state;
    });
  },

  updateTrack: (trackId: string, username: string, updates: Partial<Track>) => {
    set((state) => {
      const key = createTrackKey(trackId, username || 'default');
      const existingTrack = state.tracks.get(key);
      if (!existingTrack) {
        if (isStoreDebugEnabled()) {
          storeLog('updateTrack:miss', [
            ['key', key],
            ['updates', updates],
          ]);
        }
        return state;
      }

      const newTracks = new Map(state.tracks);
      const updatedTrack = { ...existingTrack, ...updates };
      newTracks.set(key, updatedTrack);
      if (isStoreDebugEnabled()) {
        storeLog('updateTrack', [
          ['key', key],
          ['prev', existingTrack],
          ['updates', updates],
          ['next', updatedTrack],
          ['diff', diffObjectKeys(existingTrack as unknown as Record<string, unknown>, updatedTrack as unknown as Record<string, unknown>)],
        ]);
      }
      return { tracks: newTracks };
    });
  },

  getTrack: (trackId: string, username?: string) => {
    const key = createTrackKey(trackId, username);
    return get().tracks.get(key);
  },

  hasTrack: (trackId: string, username?: string) => {
    const key = createTrackKey(trackId, username);
    return get().tracks.has(key);
  },

  clearTracks: () => {
    if (isStoreDebugEnabled()) {
      storeLog('clearTracks');
    }
    set({ tracks: new Map() });
  },
}));