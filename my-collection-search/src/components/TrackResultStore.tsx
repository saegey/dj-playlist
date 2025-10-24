import React from 'react';
import TrackResult, { type TrackResultProps } from './TrackResult';
import TrackResultCompact from './TrackResultCompact';
import { useTrack } from '@/hooks/useTrack';
import type { Track } from '@/types/track';

interface TrackResultStoreProps extends Omit<TrackResultProps, 'track'> {
  trackId: string;
  friendId: number;
  fallbackTrack?: Track; // Use this if track not in store yet
  compact?: boolean; // Use compact layout
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
  ...props
}: TrackResultStoreProps) {
  const trackFromStore = useTrack(trackId, friendId);

  // Use store data if available, otherwise fall back to the provided track
  const track = trackFromStore || fallbackTrack;

  if (!track) {
    return null; // Could render a skeleton or placeholder here
  }

  const Component = compact ? TrackResultCompact : TrackResult;

  return <Component track={track} {...props} />;
}