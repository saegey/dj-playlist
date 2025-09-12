"use client";

import React from "react";
import { useQueryClient } from '@tanstack/react-query';
import NamePlaylistDialog from "@/components/NamePlaylistDialog";
import { toaster } from "@/components/ui/toaster";
import { importPlaylist } from "@/services/playlistService";
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

  const onConfirm = React.useCallback(async (finalName: string) => {
    const trackIds = getTrackIds();
    if (!finalName.trim() || trackIds.length === 0) {
      toaster.create({ title: "Please enter a playlist name and ensure you have tracks", type: "error" });
      return;
    }

    try {
      const res = await importPlaylist(finalName.trim(), trackIds);
      if (!res.ok) throw new Error("Failed to save playlist");
      
      toaster.create({ title: "Playlist saved successfully", type: "success" });
      setOpen(false);
      setPlaylistName("");
    } catch (error) {
      console.error("Failed to save playlist:", error);
      toaster.create({ title: "Failed to save playlist", type: "error" });
    }
  }, [playlistId, queryClient]);

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
    Dialog,
  } as const;
}