"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTracksByIds } from "@/services/trackService";
import type { Track } from "@/types/track";

export function usePlaylistTracksQuery(trackIds: string[], enabled = true) {
  const query = useQuery<Track[], Error>({
    queryKey: ["playlist-tracks", trackIds],
    queryFn: () => fetchTracksByIds(trackIds),
    enabled: enabled && trackIds.length > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  return { ...query, tracks: query.data ?? [] };
}
