"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchTracksByIds } from "@/services/trackService";
import type { Track } from "@/types/track";
import { queryKeys } from "@/lib/queryKeys";
import { useTrackStore } from "@/stores/trackStore";

export function usePlaylistTracksQuery(trackIds: string[], enabled = true) {
  const { setTracks } = useTrackStore();
  
  const query = useQuery<Track[], Error>({
    queryKey: queryKeys.playlistTracks(trackIds),
    queryFn: () => fetchTracksByIds(trackIds),
    enabled: enabled && trackIds.length > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  // Populate Zustand store when tracks are fetched
  useEffect(() => {
    if (query.data && query.data.length > 0) {
      console.log('📋 usePlaylistTracksQuery calling setTracks');
      setTracks(query.data);
    }
  }, [query.data]); // Remove setTracks from dependencies - it's stable from Zustand

  return { ...query, tracks: query.data ?? [] };
}
