"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  fetchSpotifyTrackSearch,
  type SpotifyTrackSearchArgs,
  type SpotifyTrackSearchResponse,
} from "@/services/aiService";

export function useSpotifyTrackSearchQuery(
  args: SpotifyTrackSearchArgs,
  enabled: boolean
) {
  return useQuery<SpotifyTrackSearchResponse, Error>({
    queryKey: queryKeys.spotifySearchKey(args),
    queryFn: async () => fetchSpotifyTrackSearch(args),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
