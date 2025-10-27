"use client";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, InfiniteData } from "@tanstack/react-query";
import {
  searchAlbums,
  updateAlbum,
  getAlbumWithTracks,
  AlbumSearchParams,
  AlbumUpdateParams,
} from "@/services/albumService";
import { Album } from "@/types/track";
import { AlbumSearchResponse } from "@/services/albumService";

/**
 * Hook for infinite scroll album search
 */
export function useAlbumsInfiniteQuery(params: Omit<AlbumSearchParams, "offset">) {
  const limit = params.limit || 20;

  return useInfiniteQuery({
    queryKey: ["albums", "infinite", params],
    queryFn: async ({ pageParam = 0 }) => {
      return await searchAlbums({
        ...params,
        offset: pageParam,
        limit,
      });
    },
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.limit;
      if (nextOffset < lastPage.estimatedTotalHits) {
        return nextOffset;
      }
      return undefined;
    },
    initialPageParam: 0,
  });
}

/**
 * Hook for single page album search (no infinite scroll)
 */
export function useAlbumsQuery(params: AlbumSearchParams) {

  return useInfiniteQuery({
    queryKey: ["albums", params],
    queryFn: async () => {
      return await searchAlbums(params);
    },
    getNextPageParam: () => undefined, // Disable pagination
    initialPageParam: 0,
  });
}

/**
 * Hook for fetching a single album with its tracks
 */
export function useAlbumDetailQuery(releaseId: string, friendId: number) {
  return useQuery({
    queryKey: ["album", releaseId, friendId],
    queryFn: async () => {
      return await getAlbumWithTracks(releaseId, friendId);
    },
    enabled: !!releaseId && !!friendId,
  });
}

/**
 * Hook for updating album metadata
 */
export function useUpdateAlbumMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AlbumUpdateParams) => {
      return await updateAlbum(params);
    },
    onSuccess: (data) => {
      // Invalidate all album queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ["albums"] });

      // Also invalidate the specific album detail
      queryClient.invalidateQueries({
        queryKey: ["album", data.album.release_id, data.album.friend_id]
      })

      // Optionally update the specific album in cache
      queryClient.setQueriesData<InfiniteData<AlbumSearchResponse> | undefined>(
        { queryKey: ["albums"] },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: AlbumSearchResponse) => ({
              ...page,
              hits: page.hits.map((album: Album) =>
                album.release_id === data.album.release_id &&
                album.friend_id === data.album.friend_id
                  ? data.album
                  : album
              ),
            })),
          };
        }
      );
    },
  });
}
