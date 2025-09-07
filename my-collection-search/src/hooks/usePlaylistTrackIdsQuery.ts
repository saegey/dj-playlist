"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPlaylistTrackIds } from "@/services/playlistService";
import { usePlaylistTracksQuery } from "@/hooks/usePlaylistTracksQuery";
import { queryKeys } from "@/lib/queryKeys";

type Options = {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
};

export function usePlaylistTrackIdsQuery(
  playlistId: number | string | null | undefined,
  options?: Options
) {
  const idNum = typeof playlistId === "string" ? Number(playlistId) : playlistId ?? undefined;
  const query = useQuery<string[], Error>({
    queryKey: idNum ? queryKeys.playlistTrackIds(idNum) : ["playlist", idNum, "track-ids"],
    queryFn: () => fetchPlaylistTrackIds(idNum as number),
    enabled: Boolean(idNum) && (options?.enabled ?? true),
    staleTime: options?.staleTime ?? 30_000,
    gcTime: options?.gcTime ?? 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    trackIds: query.data ?? [],
  };
}

export function usePlaylistTracksByIdQuery(
  playlistId: number | string | null | undefined,
  options?: Options
) {
  const idsQuery = usePlaylistTrackIdsQuery(playlistId, options);
  const tracksQuery = usePlaylistTracksQuery(
    idsQuery.trackIds,
    (options?.enabled ?? true) && idsQuery.trackIds.length > 0
  );

  return {
    ...tracksQuery,
    trackIds: idsQuery.trackIds,
    isFetchingIds: idsQuery.isFetching,
  };
}
