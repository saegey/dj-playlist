"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTrackById } from "@/services/trackService";
import type { Track } from "@/types/track";
import { queryKeys } from "@/lib/queryKeys";

export function useTrackByIdQuery(track_id?: string, friend_id?: number, enabled = true) {
  return useQuery<Track, Error>({
    queryKey: queryKeys.tracks({ q: `track:${track_id}`, filter: { friend_id } }),
    queryFn: async () => fetchTrackById({ track_id: track_id!, friend_id: friend_id! }),
    enabled: enabled && !!track_id && !!friend_id,
  });
}
