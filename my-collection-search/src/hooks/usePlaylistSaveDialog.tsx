"use client";

import React from "react";
import { useQueryClient } from '@tanstack/react-query';
import NamePlaylistDialog from "@/components/NamePlaylistDialog";
import { toaster } from "@/components/ui/toaster";
import { importPlaylist, updatePlaylist } from "@/services/playlistService";
import { queryKeys } from '@/lib/queryKeys';
import { useTrackStore } from '@/stores/trackStore';

/**
 * Hook for save playlist dialog using query-based approach
 */
export function usePlaylistSaveDialog(playlistId?: number) {
  const queryClient = useQueryClient();
  const { getTrack, getTrackByUsername } = useTrackStore();
  const [open, setOpen] = React.useState(false);
  const [playlistName, setPlaylistName] = React.useState("");

  // Get current track IDs from cache
  const getTrackIds = React.useCallback((): string[] => {
    if (!playlistId) return [];
    return queryClient.getQueryData(queryKeys.playlistTrackIds(playlistId)) || [];
  }, [playlistId, queryClient]);

  // Get tracks with friend_id for API calls
  const getTracksWithFriendId = React.useCallback(() => {
    const trackIds = getTrackIds();
    if (trackIds.length === 0) return [];

    return trackIds
      .map(id => {
        // Try to get track using friend_id approach first, fallback to username
        let track = getTrack(id); // Try without specific friend_id first
        if (!track) {
          // Fallback to legacy username lookup during migration
          track = getTrackByUsername(id, 'saegey');
        }
        return track ? { track_id: track.track_id, friend_id: track.friend_id } : null;
      })
      .filter(Boolean) as Array<{track_id: string, friend_id: number}>;
  }, [getTrackIds, getTrack, getTrackByUsername]);

  // Main save handler - works for both new and existing playlists
  const handleSave = React.useCallback(async (finalName?: string) => {
    const tracksWithFriendId = getTracksWithFriendId();
    
    if (tracksWithFriendId.length === 0) {
      toaster.create({ title: "Cannot save empty playlist", type: "error" });
      return;
    }

    try {
      let res;
      
      if (playlistId) {
        // Existing playlist - update tracks with friend_id
        res = await updatePlaylist(playlistId, { tracks: tracksWithFriendId });
        toaster.create({ title: "Playlist updated successfully", type: "success" });
      } else {
        // New playlist - need name
        if (!finalName?.trim()) {
          toaster.create({ title: "Please enter a playlist name", type: "error" });
          return;
        }
        // Create new playlist with tracks that have friend_id
        res = await importPlaylist(finalName.trim(), tracksWithFriendId);
        toaster.create({ title: "Playlist created successfully", type: "success" });
      }
      
      if (!res.ok) throw new Error("Failed to save playlist");
      
      setOpen(false);
      setPlaylistName("");
    } catch (error) {
      console.error("Failed to save playlist:", error);
      toaster.create({ title: "Failed to save playlist", type: "error" });
    }
  }, [playlistId, getTracksWithFriendId]);

  // For existing playlists, save directly without dialog
  const saveExisting = React.useCallback(async () => {
    await handleSave();
  }, [handleSave]);

  // For new playlists, use dialog with name input
  const onConfirm = React.useCallback(async (finalName: string) => {
    await handleSave(finalName);
  }, [handleSave]);

  const trackCount = React.useMemo(() => {
    return getTrackIds().length;
  }, [getTrackIds]);

  const onCancel = React.useCallback(() => setOpen(false), []);

  const Dialog = React.useCallback(() => (
    <NamePlaylistDialog
      open={open}
      name={playlistName}
      setName={setPlaylistName}
      trackCount={trackCount}
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmLabel="Save Playlist"
    />
  ), [open, playlistName, trackCount, onConfirm, onCancel]);

  return {
    isOpen: open,
    open: () => setOpen(true),
    close: () => setOpen(false),
    saveExisting, // Direct save for existing playlists
    Dialog,
  } as const;
}