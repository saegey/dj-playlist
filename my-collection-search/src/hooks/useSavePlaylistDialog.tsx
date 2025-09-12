"use client";

import React from "react";
import NamePlaylistDialog from "@/components/NamePlaylistDialog";
import { toaster } from "@/components/ui/toaster";
import { usePlaylists } from "@/providers/PlaylistsProvider";

export function useSavePlaylistDialog() {
  const [open, setOpen] = React.useState(false);
  const {
    playlist,
    playlistName,
    setPlaylistName,
    savePlaylist,
  } = usePlaylists();

  const onConfirm = React.useCallback(async () => {
    try {
      await savePlaylist();
      toaster.create({ title: "Playlist saved successfully", type: "success" });
      setOpen(false);
    } catch (error) {
      console.error("Failed to save playlist:", error);
      toaster.create({ title: "Failed to save playlist", type: "error" });
    }
  }, [savePlaylist]);

  const Dialog = React.useCallback(() => (
    <NamePlaylistDialog
      open={open}
      name={playlistName}
      setName={setPlaylistName}
      trackCount={playlist.length}
      onConfirm={onConfirm}
      onCancel={() => setOpen(false)}
      confirmLabel="Save Playlist"
    />
  ), [open, playlist.length, playlistName, setPlaylistName, onConfirm]);

  return {
    isOpen: open,
    open: () => setOpen(true),
    close: () => setOpen(false),
    Dialog,
  } as const;
}
