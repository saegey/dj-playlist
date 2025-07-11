import { useState, useCallback } from "react";
import type { Track } from "@/types/track";

interface UseSearchResultsOptions {
  initialQuery?: string;
  initialResults?: Track[];
  initialEstimatedResults?: number;
  initialFilter?: string | null;
  initialFilterType?: "genre" | "style" | "artist" | null;
}

export function useSearchResults({
  initialQuery = "",
  initialResults = [],
  initialEstimatedResults = 0,
  initialFilter = null,
  initialFilterType = null,
}: UseSearchResultsOptions = {}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Track[]>(initialResults);
  const [estimatedResults, setEstimatedResults] = useState(initialEstimatedResults);
  const [activeFilter, setActiveFilter] = useState<string | null>(initialFilter);
  const [activeFilterType, setActiveFilterType] = useState<"genre" | "style" | "artist" | null>(initialFilterType);
  const [hasMore, setHasMore] = useState(false);

  // Example: playlistCounts could be fetched or passed in
  const [playlistCounts, setPlaylistCounts] = useState<Record<string, number>>({});

  // Handlers
  const onQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // TODO: trigger search
  }, []);

  const clearFilter = useCallback(() => {
    setActiveFilter(null);
    setActiveFilterType(null);
    // TODO: trigger search without filter
  }, []);

  const loadMore = useCallback(() => {
    // TODO: fetch more results and append
  }, []);

  // These should be passed in or handled by parent
  const addToPlaylist = useCallback((track: Track) => {
    // TODO: implement add to playlist
  }, []);

  const handleEditClick = useCallback((track: Track) => {
    // TODO: implement edit track
  }, []);

  return {
    query,
    onQueryChange,
    estimatedResults,
    activeFilter,
    activeFilterType,
    clearFilter,
    results,
    playlistCounts,
    addToPlaylist,
    handleEditClick,
    hasMore,
    loadMore,
    setResults,
    setEstimatedResults,
    setActiveFilter,
    setActiveFilterType,
    setHasMore,
    setPlaylistCounts,
  };
}
