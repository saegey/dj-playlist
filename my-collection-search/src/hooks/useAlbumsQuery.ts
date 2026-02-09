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
import { useTrackStore } from "@/stores/trackStore";
import { useTracksCacheUpdater } from "@/hooks/useTracksCacheUpdater";
import type { Track } from "@/types/track";

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
  const { updateTracksByRelease } = useTrackStore();
  const { updateTracksInCache } = useTracksCacheUpdater();

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

      // If library_identifier was part of the update, sync tracks in store + cache
      if (variables?.library_identifier !== undefined) {
        const libraryIdentifier = data.album.library_identifier ?? null;

        updateTracksByRelease(
          data.album.release_id,
          data.album.friend_id,
          { library_identifier: libraryIdentifier }
        );

        // Also patch any track caches with the new library_identifier
        const storeTracks = useTrackStore.getState().tracks;
        const patches: Array<{ track_id: string } & Partial<Track>> = [];
        for (const track of storeTracks.values()) {
          if (
            track.release_id === data.album.release_id &&
            track.friend_id === data.album.friend_id
          ) {
            patches.push({
              track_id: track.track_id,
              friend_id: track.friend_id,
              library_identifier: libraryIdentifier,
            });
          }
        }
        if (patches.length > 0) {
          updateTracksInCache(patches);
        }
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
    mutationFn: async () => {
      const response = await fetch("/api/albums/cleanup", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to cleanup albums");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullMessage += chunk;
      }

      return { message: fullMessage };
    },
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
  const response = await fetch("/api/albums/cleanup");
  if (!response.ok) {
    throw new Error("Failed to fetch cleanup summary");
  }
  return response.json();
}

/**
 * Hook for backfilling release_id on tracks
 */
export function useBackfillReleaseId() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/tracks/backfill-release-id", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to backfill release_id");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullMessage += chunk;
      }

      return { message: fullMessage };
    },
    onSuccess: () => {
      // Invalidate all queries to refetch with corrected data
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
    },
  });
}
