"use client";

import { deletePlaylist } from "@/services/playlistService";
import { useMutation } from "@tanstack/react-query";

export function useDeletePlaylistMutation() {
  return useMutation<void, Error, number>({
    mutationFn: async (playlistId: number) => deletePlaylist(playlistId),
  });
}
