"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importPlaylist } from "@/services/playlistService";

export function useCreatePlaylistMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { name: string; tracks: string[] }) => {
      const res = await importPlaylist(args.name, args.tracks);
      if (!res.ok) throw new Error("Failed to create playlist");
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playlists"], refetchType: "active" });
    },
  });
}
