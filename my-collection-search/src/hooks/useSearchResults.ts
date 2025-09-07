import { useMemo, useCallback, useState } from "react";
import type { MeiliSearch } from "meilisearch";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { Track } from "@/types/track";
import { useMeili } from "@/providers/MeiliProvider";
import { useUsername } from "@/providers/UsernameProvider";
import { queryKeys } from "@/lib/queryKeys";

interface UseSearchResultsOptions {
  client?: MeiliSearch | null; // optional override; defaults to provider
  username?: string; // optional override; defaults to provider
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
  username,
  filter,
  mode = "infinite",
  limit: limitOverride,
  page,
}: UseSearchResultsOptions) {
  const [query, setQuery] = useState("");
  const limit = limitOverride ?? DEFAULT_LIMIT;
  const qc = useQueryClient();
  // Resolve from providers by default
  const { client: ctxClient, ready } = useMeili();
  const { username: ctxUsername } = useUsername();
  const effClient = client ?? ctxClient;
  const effUsername = username ?? ctxUsername;

  // Stable filter shape for caching
  const searchFilter = useMemo(
    () => filter ?? (effUsername ? [`username = "${effUsername}"`] : undefined),
    [filter, effUsername]
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

  // --- Playlist counts (dependent query on unique IDs) ---
  const ids = useMemo(
    () => Array.from(new Set(results.map((t) => t.track_id))),
    [results]
  );

  const countsQuery = useQuery({
    queryKey: queryKeys.playlistCounts(ids),
    enabled: enabled && ids.length > 0,
    queryFn: async () => {
      const res = await fetch("/api/tracks/playlist_counts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_ids: ids }),
      });
      if (!res.ok) throw new Error("Failed to fetch playlist counts");
      return (await res.json()) as Record<string, number>;
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
    results,
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
