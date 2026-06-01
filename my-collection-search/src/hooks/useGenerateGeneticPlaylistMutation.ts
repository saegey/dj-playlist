"use client";

import { useMutation } from "@tanstack/react-query";
import {
  generateOptimizedPlaylist,
  type PlaylistOptimizerMode,
} from "@/services/internalApi/playlists";
import type { Track } from "@/types/track";

type GeneratePlaylistVariables =
  | Track[]
  | {
      playlist: Track[];
      mode?: PlaylistOptimizerMode;
    };

export function useGenerateGeneticPlaylistMutation() {
  return useMutation<Track[], Error, GeneratePlaylistVariables>({
    mutationFn: async (variables) => {
      const playlist = Array.isArray(variables) ? variables : variables.playlist;
      const mode = Array.isArray(variables) ? "genetic" : variables.mode;
      return generateOptimizedPlaylist(playlist, mode);
    },
  });
}
