import React from 'react';
import TrackResult, { type TrackResultProps } from './TrackResult';
import TrackResultCompact from './TrackResultCompact';
import PlaylistTrackItem from './PlaylistTrackItem';
import { useTrack } from '@/hooks/useTrack';
import type { Track } from '@/types/track';
import { useTrackStore } from '@/stores/trackStore';

interface TrackResultStoreProps extends Omit<TrackResultProps, 'track'> {
  trackId: string;
  friendId: number;
  fallbackTrack?: Track; // Use this if track not in store yet
  compact?: boolean; // Use compact layout
  playlistMode?: boolean; // Use playlist-optimized layout
  fetchIfMissing?: boolean; // Fetch from API if not in store
}

/**
 * TrackResult component that reads track data from the Zustand store
 * instead of using the passed track prop. This ensures data consistency
 * when tracks are edited in multiple places.
 */
export default function TrackResultStore({
  trackId,
  friendId,
  fallbackTrack,
  compact = false,
  playlistMode = false,
  fetchIfMissing = false,
  ...props
}: TrackResultStoreProps) {
  const trackFromStore = useTrack(trackId, friendId);
  const { setTrack } = useTrackStore();
  const fetchKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!fetchIfMissing || trackFromStore) return;
    const key = `${trackId}:${friendId}`;
    if (fetchKeyRef.current === key) return;
    fetchKeyRef.current = key;
    let active = true;

    fetch(`/api/tracks/${encodeURIComponent(trackId)}?friend_id=${friendId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((track) => {
        if (!active || !track) return;
        const normalized: Track = {
          ...(track as Track),
          track_id: String((track as Track).track_id),
          friend_id: Number((track as Track).friend_id),
        };
        setTrack(normalized);
      })
      .catch(() => {
        // Silent fail; fallback track stays visible.
      });

    return () => {
      active = false;
    };
  }, [fetchIfMissing, trackFromStore, trackId, friendId, setTrack]);

  // Use store data if available, otherwise fall back to the provided track
  const track = trackFromStore || fallbackTrack;

  if (!track) {
    return null; // Could render a skeleton or placeholder here
  }

  const Component = playlistMode
    ? PlaylistTrackItem
    : compact
    ? TrackResultCompact
    : TrackResult;

  return <Component track={track} {...props} />;
}
