"use client";
import { useEffect } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, InfiniteData } from "@tanstack/react-query";
import {
  cleanupAlbumsStream,
  fetchAlbumsCleanupSummary,
  getAlbumWithTracks,
  searchAlbums,
  updateAlbum,
  type AlbumSearchParams,
  type AlbumSearchResponse,
  type AlbumUpdateParams,
} from "@/services/internalApi/albums";
import { Album } from "@/types/track";
import { useTrackStore } from "@/stores/trackStore";
import { useAlbumStore } from "@/stores/albumStore";

/**
 * Hook for infinite scroll album search
 */
export function useAlbumsInfiniteQuery(params: Omit<AlbumSearchParams, "offset">) {
  const limit = params.limit || 20;
  const setAlbums = useAlbumStore((state) => state.setAlbums);

  const query = useInfiniteQuery({
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

  useEffect(() => {
    const albums = query.data?.pages.flatMap((p) => p.hits ?? []) ?? [];
    if (albums.length > 0) {
      setAlbums(albums);
    }
  }, [query.data, setAlbums]);

  const albumRefs =
    query.data?.pages.flatMap((page) =>
      (page.hits ?? []).map((a) => ({
        releaseId: a.release_id,
        friendId: a.friend_id,
      }))
    ) ?? [];

  return { ...query, albumRefs };
}

/**
 * Hook for single page album search (no infinite scroll)
 */
export function useAlbumsQuery(params: AlbumSearchParams) {
  const setAlbums = useAlbumStore((state) => state.setAlbums);

  const query = useInfiniteQuery({
    queryKey: ["albums", params],
    queryFn: async () => {
      return await searchAlbums(params);
    },
    getNextPageParam: () => undefined, // Disable pagination
    initialPageParam: 0,
  });

  useEffect(() => {
    const albums = query.data?.pages.flatMap((p) => p.hits ?? []) ?? [];
    if (albums.length > 0) {
      setAlbums(albums);
    }
  }, [query.data, setAlbums]);

  const albumRefs =
    query.data?.pages.flatMap((page) =>
      (page.hits ?? []).map((a) => ({
        releaseId: a.release_id,
        friendId: a.friend_id,
      }))
    ) ?? [];

  return { ...query, albumRefs };
}

/**
 * Hook for fetching a single album with its tracks
 */
export function useAlbumDetailQuery(releaseId: string, friendId: number) {
  const setAlbum = useAlbumStore((state) => state.setAlbum);
  const markAlbumHydrated = useAlbumStore((state) => state.markAlbumHydrated);
  const { setTracks, markReleaseHydrated } = useTrackStore();

  const query = useQuery({
    queryKey: ["album", releaseId, friendId],
    queryFn: async () => {
      return await getAlbumWithTracks(releaseId, friendId);
    },
    enabled: !!releaseId && !!friendId,
  });

  useEffect(() => {
    if (!query.data) return;
    setAlbum(query.data.album);
    if (query.data.tracks?.length) {
      setTracks(query.data.tracks);
    }
    markAlbumHydrated(releaseId, friendId);
    markReleaseHydrated(releaseId, friendId);
  }, [
    query.data,
    releaseId,
    friendId,
    setAlbum,
    setTracks,
    markAlbumHydrated,
    markReleaseHydrated,
  ]);

  return query;
}

/**
 * Hook for updating album metadata
 */
export function useUpdateAlbumMutation() {
  const queryClient = useQueryClient();
  const { updateTracksByRelease } = useTrackStore();
  const { setAlbum } = useAlbumStore();

  return useMutation({
    mutationFn: async (params: AlbumUpdateParams) => {
      return await updateAlbum(params);
    },
    onSuccess: (data, variables) => {
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
      setAlbum(data.album);

      // If library_identifier was part of the update, sync tracks in store + cache
      if (variables?.library_identifier !== undefined) {
        const libraryIdentifier = data.album.library_identifier ?? null;

        updateTracksByRelease(
          data.album.release_id,
          data.album.friend_id,
          { library_identifier: libraryIdentifier }
        );
      }
    },
  });
}

/**
 * Hook for cleaning up albums with no tracks
 */
export function useCleanupAlbums() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => cleanupAlbumsStream(),
    onSuccess: () => {
      // Invalidate all album queries to refetch with cleaned data
      queryClient.invalidateQueries({ queryKey: ["albums"] });
    },
  });
}

/**
 * Get summary of albums that would be cleaned up (without deleting)
 */
export async function getAlbumsCleanupSummary() {
  return await fetchAlbumsCleanupSummary();
}
