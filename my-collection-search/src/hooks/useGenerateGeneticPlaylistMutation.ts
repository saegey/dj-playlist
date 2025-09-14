"use client";

import { useMutation } from "@tanstack/react-query";
import { generateGeneticPlaylist } from "@/services/playlistService";
import type { Track } from "@/types/track";

export function useGenerateGeneticPlaylistMutation() {
  return useMutation<Track[], Error, Track[]>({
    mutationFn: async (playlist: Track[]) => generateGeneticPlaylist(playlist),
  });
}
