// hooks/useSpotifyQuery.ts
"use client";
import { useMutation } from "@tanstack/react-query";
import {
  ingestSpotifyIndex,
  downloadSpotifyLibrary,
  type SpotifySyncStatus,
} from "@/services/internalApi/spotify";

export function useIngestSpotifyIndex() {
  return useMutation<{ message: string }, Error, void>({
    mutationFn: () => ingestSpotifyIndex(),
  });
}

export function useDownloadSpotify() {
  return useMutation<SpotifySyncStatus | null, Error, { username: string }>({
    mutationFn: ({ username }) => downloadSpotifyLibrary(username),
  });
}
