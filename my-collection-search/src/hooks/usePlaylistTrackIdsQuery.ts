"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchPlaylistTrackIds,
  type PlaylistTrackIdsResponse,
} from "@/services/playlistService";
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
  const query = useQuery<PlaylistTrackIdsResponse, Error>({
    queryKey: idNum ? queryKeys.playlistTrackIds(idNum) : ["playlist", idNum, "track-ids"],
    queryFn: async () => {
      const result = await fetchPlaylistTrackIds(idNum as number);
      return result;
    },
    enabled: Boolean(idNum) && (options?.enabled ?? true),
    staleTime: options?.staleTime ?? 30_000,
    gcTime: options?.gcTime ?? 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    tracks: query.data?.tracks ?? [],
    playlistName: query.data?.playlist_name ?? null,
  };
}

export function usePlaylistTracksByIdQuery(
  playlistId: number | string | null | undefined,
  options?: Options
) {
  const idsQuery = usePlaylistTrackIdsQuery(playlistId, options);
  const tracksQuery = usePlaylistTracksQuery(
    idsQuery.tracks.map(({ track_id, friend_id }) => ({ track_id, friend_id })),
    (options?.enabled ?? true) && idsQuery.tracks.length > 0
  );

  return {
    ...tracksQuery,
    trackRefs: idsQuery.tracks,
    isFetchingIds: idsQuery.isFetching,
  };
}
