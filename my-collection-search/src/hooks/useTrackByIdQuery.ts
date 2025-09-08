"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTrackById } from "@/services/trackService";
import type { Track } from "@/types/track";
import { queryKeys } from "@/lib/queryKeys";

export function useTrackByIdQuery(track_id?: string, username?: string, enabled = true) {
  return useQuery<Track, Error>({
    queryKey: queryKeys.tracks({ q: `track:${track_id}`, filter: { username } }),
    queryFn: async () => fetchTrackById({ track_id: track_id!, username: username! }),
    enabled: enabled && !!track_id && !!username,
  });
}
