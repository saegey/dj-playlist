import { useState, useCallback } from "react";
import type { Track } from "@/types/track";

import { useEffect } from "react";
import type { MeiliSearch } from "meilisearch";

interface UseSearchResultsOptions {
  client: MeiliSearch | null;
  username?: string;
}

export function useSearchResults({
  client,
  username,
}: UseSearchResultsOptions) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [estimatedResults, setEstimatedResults] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeFilterType, setActiveFilterType] = useState<
    "genre" | "style" | "artist" | null
  >(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [playlistCounts, setPlaylistCounts] = useState<Record<string, number>>(
    {}
  );
  const limit = 20;
  const [refreshFlag, setRefreshFlag] = useState(false);

  // Helper to fetch playlist counts for a list of track IDs
  const fetchPlaylistCounts = useCallback(async (trackIds: string[]) => {
    if (!trackIds || trackIds.length === 0) return;
    try {
      const res = await fetch("/api/tracks/playlist_counts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_ids: trackIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylistCounts((prev) => ({ ...prev, ...data }));
      }
    } catch {
      // Ignore errors for now
    }
  }, []);

  // Search refresh logic
  // (removed duplicate refreshSearch declaration)

  // Search logic
  useEffect(() => {
    if (!client) {
      return;
    }
    const filter = username ? [`username = "${username}"`] : undefined;
    if (!query) {
      (async () => {
        const index = client.index<Track>("tracks");
        const stats = await index.getStats();
        const total = stats.numberOfDocuments || 0;
        const randomOffset =
          total > 10 ? Math.floor(Math.random() * (total - 10)) : 0;
        const res = await index.search("", {
          limit: 10,
          offset: randomOffset,
          filter,
        });
        setResults(res.hits);
        setEstimatedResults(total);
        setOffset(10);
        setHasMore(total > 10);
        fetchPlaylistCounts(res.hits.map((t) => t.track_id));
      })();
      return;
    }

    const search = async () => {
      const index = client.index<Track>("tracks");
      const res = await index.search(query, { limit, offset: 0, filter });
      setResults(res.hits);
      setOffset(limit);
      setHasMore(res.hits.length === limit);
      setEstimatedResults(res.estimatedTotalHits || 0);
      fetchPlaylistCounts(res.hits.map((t) => t.track_id));
    };
    search();
  }, [query, fetchPlaylistCounts, client, username]);

  const refreshSearch = useCallback(() => {
    if (!client) {
      return;
    }
    const filter = username ? [`username = "${username}"`] : undefined;
    const index = client.index<Track>("tracks");
    index.search(query, { limit, offset: 0, filter }).then((res) => {
      setResults(res.hits);
      setEstimatedResults(res.estimatedTotalHits || 0);
      setOffset(limit);
      setHasMore(res.hits.length === limit);
      fetchPlaylistCounts(res.hits.map((t) => t.track_id));
    });
  }, [client, query, limit, fetchPlaylistCounts, username]);

  // Effect to refresh search when refreshFlag is set
  useEffect(() => {
    if (refreshFlag) {
      refreshSearch();
      setRefreshFlag(false);
    }
  }, [refreshFlag, refreshSearch]);

  // Method to trigger a refresh from outside
  const needsRefresh = useCallback(() => {
    setRefreshFlag(true);
  }, []);

  const clearFilter = useCallback(() => {
    setActiveFilter(null);
    setActiveFilterType(null);
    setQuery("");
    setOffset(0);
    setHasMore(false);
    (async () => {
      if (!client) {
        return;
      }
      const index = client.index<Track>("tracks");
      const stats = await index.getStats();
      const total = stats.numberOfDocuments || 0;
      const randomOffset =
        total > 10 ? Math.floor(Math.random() * (total - 10)) : 0;
      const res = await index.search("", { limit: 10, offset: randomOffset });
      setResults(res.hits);
      setEstimatedResults(total);
      setOffset(10);
      setHasMore(total > 10);
    })();
  }, [client]);

  const loadMore = useCallback(async () => {
    if (!client) {
      return;
    }
    const index = client.index<Track>("tracks");
    // let res;
    // if (activeFilter || activeFilterType) {
    //   let filter;
    //   if (activeFilterType === "genre") filter = [`genres = \"${activeFilter}\"`];
    //   else if (activeFilterType === "style") filter = [`styles = \"${activeFilter}\"`];
    //   else if (activeFilterType === "artist") filter = [`artist = \"${activeFilter}\"`];
    //   res = await index.search("", { filter, limit, offset });
    // } else {
    //   res = await index.search(query, { limit, offset });
    // }
    const filter = username ? [`username = "${username}"`] : undefined;

    const res = await index.search(query, { limit, offset, filter });
    setResults((prev) => {
      const newTracks = res.hits.filter((t) => !(t.track_id in playlistCounts));
      if (newTracks.length > 0)
        fetchPlaylistCounts(newTracks.map((t) => t.track_id));
      return [...prev, ...res.hits];
    });
    setOffset(offset + limit);
    setHasMore(res.hits.length === limit);
  }, [client, username, query, offset, fetchPlaylistCounts, playlistCounts]);

  const onQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  return {
    query,
    onQueryChange,
    estimatedResults,
    activeFilter,
    activeFilterType,
    clearFilter,
    results,
    playlistCounts,
    hasMore,
    loadMore,
    refreshSearch,
    needsRefresh,
  };
}
