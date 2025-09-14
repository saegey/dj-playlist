"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toaster } from "@/components/ui/toaster";
import { updatePlaylist, importPlaylist } from "@/services/playlistService";
import { queryKeys } from "@/lib/queryKeys";
import type { Track, Playlist } from "@/types/track";
import PlaylistSelectionDialog from "@/components/PlaylistSelectionDialog";
import NamePlaylistDialog from "@/components/NamePlaylistDialog";

/**
 * Hook for managing add-to-playlist dialog workflow
 */
export function useAddToPlaylistDialog() {
  const queryClient = useQueryClient();
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = React.useState(false);
  const [isNameDialogOpen, setIsNameDialogOpen] = React.useState(false);
  const [playlistName, setPlaylistName] = React.useState("");
  const [currentTrack, setCurrentTrack] = React.useState<Track | null>(null);

  // Mutation for adding track to existing playlist
  const addToPlaylistMutation = useMutation({
    mutationFn: async ({ playlist, track }: { playlist: Playlist; track: Track }) => {
      // Check if track already exists in playlist
      const existingTracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
      const trackExists = existingTracks.some((t) => 
        typeof t === 'string' ? t === track.track_id : t.track_id === track.track_id
      );
      
      if (trackExists) {
        throw new Error(`Track is already in playlist "${playlist.name}"`);
      }

      // Add track to end of playlist
      const updatedTracks = [
        ...existingTracks,
        { track_id: track.track_id, friend_id: track.friend_id }
      ];

      const res = await updatePlaylist(playlist.id, { tracks: updatedTracks });
      if (!res.ok) {
        throw new Error("Failed to update playlist");
      }

      return { playlist, track };
    },
    onSuccess: ({ playlist, track }) => {
      toaster.create({
        title: `"${track.title}" added to "${playlist.name}"`,
        type: "success",
      });
      // Invalidate playlist queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlistTrackIds(playlist.id) });
    },
    onError: (error) => {
      toaster.create({
        title: error.message || "Failed to add track to playlist",
        type: "error",
      });
    },
  });

  // Mutation for creating new playlist with track
  const createPlaylistMutation = useMutation({
    mutationFn: async ({ name, track }: { name: string; track: Track }) => {
      const res = await importPlaylist(name, [
        { track_id: track.track_id, friend_id: track.friend_id }
      ]);
      if (!res.ok) {
        throw new Error("Failed to create playlist");
      }
      return { name, track };
    },
    onSuccess: ({ name, track }) => {
      toaster.create({
        title: `Created "${name}" with "${track.title}"`,
        type: "success",
      });
      // Invalidate playlist queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists() });
    },
    onError: (error) => {
      toaster.create({
        title: error.message || "Failed to create playlist",
        type: "error",
      });
    },
  });

  // Open dialog for track
  const openForTrack = React.useCallback((track: Track) => {
    setCurrentTrack(track);
    setIsPlaylistDialogOpen(true);
  }, []);

  // Handle playlist selection
  const handlePlaylistSelect = React.useCallback((playlist: Playlist) => {
    if (currentTrack) {
      addToPlaylistMutation.mutate({ playlist, track: currentTrack });
    }
    setIsPlaylistDialogOpen(false);
  }, [currentTrack, addToPlaylistMutation]);

  // Handle create new playlist
  const handleCreateNew = React.useCallback((name?: string) => {
    setIsPlaylistDialogOpen(false);
    if (name?.trim()) {
      // If name provided, create immediately
      if (currentTrack) {
        createPlaylistMutation.mutate({ name: name.trim(), track: currentTrack });
      }
    } else {
      // Otherwise show name dialog
      setIsNameDialogOpen(true);
    }
  }, [currentTrack, createPlaylistMutation]);

  // Handle new playlist name confirmation
  const handleNameConfirm = React.useCallback((name: string) => {
    if (currentTrack && name.trim()) {
      createPlaylistMutation.mutate({ name: name.trim(), track: currentTrack });
    }
    setIsNameDialogOpen(false);
    setPlaylistName("");
  }, [currentTrack, createPlaylistMutation]);

  // Handle dialog close
  const handleClose = React.useCallback(() => {
    setIsPlaylistDialogOpen(false);
    setCurrentTrack(null);
  }, []);

  const handleNameCancel = React.useCallback(() => {
    setIsNameDialogOpen(false);
    setPlaylistName("");
  }, []);

  // Dialog components
  const PlaylistDialog = React.useCallback(() => (
    <PlaylistSelectionDialog
      open={isPlaylistDialogOpen}
      onClose={handleClose}
      onPlaylistSelect={handlePlaylistSelect}
      onCreateNew={handleCreateNew}
      title={currentTrack ? `Add "${currentTrack.title}" to Playlist` : "Add to Playlist"}
    />
  ), [isPlaylistDialogOpen, currentTrack, handleClose, handlePlaylistSelect, handleCreateNew]);

  const NameDialog = React.useCallback(() => (
    <NamePlaylistDialog
      open={isNameDialogOpen}
      name={playlistName}
      setName={setPlaylistName}
      trackCount={1}
      onConfirm={handleNameConfirm}
      onCancel={handleNameCancel}
      confirmLabel="Create Playlist"
    />
  ), [isNameDialogOpen, playlistName, handleNameConfirm, handleNameCancel]);

  return {
    openForTrack,
    PlaylistDialog,
    NameDialog,
    isLoading: addToPlaylistMutation.isPending || createPlaylistMutation.isPending,
  } as const;
}