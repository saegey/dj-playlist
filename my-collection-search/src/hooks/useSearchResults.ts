import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import type { MeiliSearch } from "meilisearch";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { Friend, Track } from "@/types/track";
import { useMeili } from "@/providers/MeiliProvider";
import { useUsername } from "@/providers/UsernameProvider";
import { queryKeys } from "@/lib/queryKeys";
import { fetchPlaylistCounts } from "@/services/trackService";
import { useTrackStore } from "@/stores/trackStore";

interface UseSearchResultsOptions {
  client?: MeiliSearch | null; // optional override; defaults to provider
  friend?: Friend | null; // optional override; defaults to provider
  filter?: string | string[];
  // New: choose between infinite scroll (default) or single-page pagination
  mode?: "infinite" | "page";
  // New: override page size
  limit?: number;
  // New: current page number (1-based) for page mode
  page?: number;
}

type SearchPage = {
  hits: Track[];
  estimatedTotalHits: number;
  offset: number;
  limit: number;
};

const DEFAULT_LIMIT = 20;

export function useSearchResults({
  client,
  friend,
  filter,
  mode = "infinite",
  limit: limitOverride,
  page,
}: UseSearchResultsOptions) {
  const [query, setQuery] = useState("");
  const limit = limitOverride ?? DEFAULT_LIMIT;
  const qc = useQueryClient();
  const { setTracks } = useTrackStore();
  const populatedTrackIds = useRef(new Set<string>()); // Track which IDs we've already populated
  // Resolve from providers by default
  const { client: ctxClient, ready } = useMeili();
  const { friend: ctxFriend } = useUsername();
  const effClient = client ?? ctxClient;
  const friendId = friend?.id ?? ctxFriend?.id;

  // Stable filter shape for caching
  const searchFilter = useMemo(
    () => filter ?? (friendId ? [`friend_id = "${friendId}"`] : undefined),
    [filter, friendId]
  );

  const enabled = !!effClient && (ready ?? true);
  const bootstrapping = !effClient || ready === false;

  // --- Tracks query (infinite or single page) ---
  const isInfinite = mode === "infinite";

  const infiniteQuery = useInfiniteQuery<SearchPage, Error>({
    queryKey: queryKeys.tracks({ q: query, filter: searchFilter, limit, mode }),
    enabled: enabled && isInfinite,
    queryFn: async (context): Promise<SearchPage> => {
      const pageParam =
        typeof context.pageParam === "number" ? context.pageParam : 0;
      const index = effClient!.index<Track>("tracks");
      const res = await index.search(query || "", {
        limit,
        offset: pageParam,
        filter: searchFilter,
      });
      return {
        hits: res.hits,
        estimatedTotalHits: res.estimatedTotalHits || 0,
        offset: pageParam,
        limit,
      };
    },
    getNextPageParam: (last: SearchPage) => {
      const next = last.offset + last.hits.length;
      return next < last.estimatedTotalHits ? next : undefined;
    },
    initialPageParam: 0,
    staleTime: 10_000,
    gcTime: 5 * 60_000,
  });

  const singlePageQuery = useQuery<SearchPage, Error>({
    queryKey: queryKeys.tracks({
      q: query,
      filter: searchFilter,
      limit,
      mode,
      page: page ?? 1,
    }),
    enabled: enabled && !isInfinite && !!effClient,
    queryFn: async (): Promise<SearchPage> => {
      const index = effClient!.index<Track>("tracks");
      const currentPage = Math.max(1, page ?? 1);
      const offset = (currentPage - 1) * limit;
      const res = await index.search(query || "", {
        limit,
        offset,
        filter: searchFilter,
      });
      return {
        hits: res.hits,
        estimatedTotalHits: res.estimatedTotalHits || 0,
        offset,
        limit,
      };
    },
    staleTime: 10_000,
    gcTime: 5 * 60_000,
  });

  const pages = isInfinite
    ? infiniteQuery.data?.pages ?? []
    : singlePageQuery.data
    ? [singlePageQuery.data]
    : [];
  const results = pages.flatMap((p) => p.hits);
  const estimatedResults = pages[0]?.estimatedTotalHits ?? 0;

  // Populate Zustand store when results change - but only with new tracks
  useEffect(() => {
    if (results.length === 0) return;
    
    // Filter to only new tracks that we haven't populated yet
    const newTracks = results.filter(track => {
      const key = `${track.track_id}:${track.friend_id || 'default'}`;
      return !populatedTrackIds.current.has(key);
    });
    
    if (newTracks.length > 0) {
      console.log('🔍 useSearchResults calling setTracks with', newTracks.length, 'new tracks');
      setTracks(newTracks);
      
      // Mark these tracks as populated
      newTracks.forEach(track => {
        const key = `${track.track_id}:${track.friend_id || 'default'}`;
        populatedTrackIds.current.add(key);
      });
    }
  }, [results, setTracks]); // Check on every results change, but only populate new ones

  // Return track info instead of full track objects to force components to read from store
  const trackInfo = results.map((track) => ({
    trackId: track.track_id,
    friendId: track.friend_id
  }));

  // --- Playlist counts (dependent query on unique IDs) ---
  const ids = useMemo(
    () => Array.from(new Set(results.map((t) => t.track_id))),
    [results]
  );

  const countsQuery = useQuery({
    queryKey: queryKeys.playlistCounts(ids),
    enabled: enabled && ids.length > 0,
    queryFn: async () => {
  return await fetchPlaylistCounts(ids);
    },
    staleTime: 60_000,
  });

  // --- API compatibility layer ---
  const hasMore = isInfinite
    ? !!infiniteQuery.hasNextPage
    : (page ?? 1) * limit < estimatedResults;
  const loadMore = useCallback(() => {
    if (isInfinite) return infiniteQuery.fetchNextPage();
    // no-op in page mode; parent controls page state
  }, [infiniteQuery, isInfinite]);
  const refreshSearch = useCallback(() => {
    return isInfinite ? infiniteQuery.refetch() : singlePageQuery.refetch();
  }, [infiniteQuery, singlePageQuery, isInfinite]);

  // Old hook had a refreshFlag with needsRefresh(). Here we invalidate cache.
  const needsRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.tracks({}) });
  }, [qc]);

  // “Clear filter” previously loaded random docs; we emulate that by
  // setting a random window into the cache for the current key.
  const clearFilter = useCallback(async () => {
    if (!effClient) return;
    const index = effClient.index<Track>("tracks");
    const stats = await index.getStats();
    const total = stats.numberOfDocuments || 0;
    const sampleLimit = 10;
    const randomOffset =
      total > sampleLimit
        ? Math.floor(Math.random() * (total - sampleLimit))
        : 0;
    const r = await index.search("", {
      limit: sampleLimit,
      offset: randomOffset,
    });

    // Write a single-page result into this query's cache to match infiniteQuery shape
    const key = queryKeys.tracks({ q: "", filter: searchFilter, limit });
    qc.setQueryData<{ pageParams: number[]; pages: SearchPage[] }>(key, {
      pageParams: [0],
      pages: [
        {
          hits: r.hits,
          estimatedTotalHits: total,
          offset: 0,
          limit: sampleLimit,
        },
      ],
    });

    // Also update local query string so UI input reflects cleared state
    setQuery("");
  }, [effClient, qc, searchFilter, limit]);

  // onChange helper kept for drop-in compatibility
  const onQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    []
  );

  // loading: combine initial + fetching-next
  const loading = isInfinite
    ? bootstrapping || infiniteQuery.isPending || infiniteQuery.isFetching
    : bootstrapping || singlePageQuery.isPending || singlePageQuery.isFetching;

  // setLoading existed in the old API; provide a no-op to avoid breakage.
  const setLoading = useCallback(() => {
    // no-op; handled by React Query now
  }, []);

  return {
    // data
    estimatedResults,
    results, // Keep this for backward compatibility
    trackInfo, // New: track info for components to read from store
    playlistCounts: countsQuery.data ?? {},

    // status
    hasMore,
    loading,

    // actions
    loadMore,
    refreshSearch,
    needsRefresh,
    clearFilter,

    // query state
    query,
    setQuery,
    onQueryChange,

    // legacy compatibility
    setLoading,
  };
}
