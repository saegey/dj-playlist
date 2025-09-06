"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPlaylists } from "@/services/playlistService";
import type { Playlist } from "@/types/track";

type Options = {
  enabled?: boolean;
  staleTime?: number;
};

export function usePlaylistsQuery(options?: Options) {
  const query = useQuery<Playlist[], Error>({
    queryKey: ["playlists"],
    queryFn: fetchPlaylists,
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    playlists: query.data ?? [],
    isPending: query.isPending,
  };
}
