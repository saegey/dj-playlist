"use client";

import React from "react";
import { useQueryClient } from '@tanstack/react-query';
import NamePlaylistDialog from "@/components/NamePlaylistDialog";
import { toaster } from "@/components/ui/toaster";
import { importPlaylist, updatePlaylist } from "@/services/playlistService";
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook for save playlist dialog using query-based approach
 */
export function usePlaylistSaveDialog(playlistId?: number) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [playlistName, setPlaylistName] = React.useState("");

  // Get current track IDs from cache
  const getTrackIds = (): string[] => {
    if (!playlistId) return [];
    return queryClient.getQueryData(queryKeys.playlistTrackIds(playlistId)) || [];
  };

  // Main save handler - works for both new and existing playlists
  const handleSave = React.useCallback(async (finalName?: string) => {
    const trackIds = getTrackIds();
    
    if (trackIds.length === 0) {
      toaster.create({ title: "Cannot save empty playlist", type: "error" });
      return;
    }

    try {
      let res;
      
      if (playlistId) {
        // Existing playlist - update tracks only (no name change for now)
        res = await updatePlaylist(playlistId, { tracks: trackIds });
        toaster.create({ title: "Playlist updated successfully", type: "success" });
      } else {
        // New playlist - need name
        if (!finalName?.trim()) {
          toaster.create({ title: "Please enter a playlist name", type: "error" });
          return;
        }
        res = await importPlaylist(finalName.trim(), trackIds);
        toaster.create({ title: "Playlist created successfully", type: "success" });
      }
      
      if (!res.ok) throw new Error("Failed to save playlist");
      
      setOpen(false);
      setPlaylistName("");
    } catch (error) {
      console.error("Failed to save playlist:", error);
      toaster.create({ title: "Failed to save playlist", type: "error" });
    }
  }, [playlistId, queryClient]);

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
  }, [playlistId, queryClient]);

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