import { useMemo, useCallback, useState } from "react";
import type { MeiliSearch } from "meilisearch";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Track } from "@/types/track";

interface UseSearchResultsOptions {
  client: MeiliSearch | null;
  username?: string;
  filter?: string | string[];
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
}: UseSearchResultsOptions) {
  const [query, setQuery] = useState("");
  const limit = DEFAULT_LIMIT;
  const qc = useQueryClient();

  // Stable filter shape for caching
  const searchFilter = useMemo(
    () => filter ?? (username ? [`username = "${username}"`] : undefined),
    [filter, username]
  );

  const enabled = !!client;

  // --- Infinite tracks query ---
  const tracksQuery = useInfiniteQuery<SearchPage, Error>({
    queryKey: ["tracks", { q: query, filter: searchFilter, limit }],
    enabled,
    queryFn: async (context): Promise<SearchPage> => {
      const pageParam =
        typeof context.pageParam === "number" ? context.pageParam : 0;
      const index = client!.index<Track>("tracks");
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
    // keepPreviousData helps avoid UI flicker between param changes
    // keepPreviousData: true,
    staleTime: 10_000,
    gcTime: 5 * 60_000,
  });

  const pages = tracksQuery.data?.pages ?? [];
  const results = pages.flatMap((p) => p.hits);
  const estimatedResults = pages[0]?.estimatedTotalHits ?? 0;

  // --- Playlist counts (dependent query on unique IDs) ---
  const ids = useMemo(
    () => Array.from(new Set(results.map((t) => t.track_id))),
    [results]
  );

  const countsQuery = useQuery({
    queryKey: ["playlistCounts", ids],
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
  const hasMore = !!tracksQuery.hasNextPage;
  const loadMore = useCallback(
    () => tracksQuery.fetchNextPage(),
    [tracksQuery]
  );
  const refreshSearch = useCallback(() => tracksQuery.refetch(), [tracksQuery]);

  // Old hook had a refreshFlag with needsRefresh(). Here we invalidate cache.
  const needsRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["tracks"] });
  }, [qc]);

  // “Clear filter” previously loaded random docs; we emulate that by
  // setting a random window into the cache for the current key.
  const clearFilter = useCallback(async () => {
    if (!client) return;
    const index = client.index<Track>("tracks");
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
    const key = ["tracks", { q: "", filter: searchFilter, limit }];
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
  }, [client, qc, searchFilter, limit]);

  // onChange helper kept for drop-in compatibility
  const onQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    []
  );

  // loading: combine initial + fetching-next
  const loading = tracksQuery.isLoading || tracksQuery.isFetching;

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
