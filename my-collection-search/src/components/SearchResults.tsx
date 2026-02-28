"use client";

import React from "react";
import { Box, Text, IconButton, Flex, Spinner, Badge } from "@chakra-ui/react";
import { LuLayoutGrid, LuTable, LuMaximize2, LuMinimize2, LuFilter } from "react-icons/lu";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

import TrackResultStore from "@/components/TrackResultStore";
import TrackTableViewWithLoader from "@/components/TrackTableViewWithLoader";
import UnifiedSearchControls from "@/components/search/UnifiedSearchControls";
import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import { useSearchResults } from "@/hooks/useSearchResults";
import TrackActionsMenu from "@/components/TrackActionsMenu";
import { useTrack } from "@/hooks/useTrack";
import TracksFilterModal, { TracksFilter } from "@/components/TracksFilterModal";
import { buildMeiliSearchFilters, createEmptyFilters, getActiveFilterCount } from "@/lib/trackFilters";
import { useUsername } from "@/providers/UsernameProvider";

const TrackResultItem: React.FC<{
  trackId: string;
  friendId: number;
  playlistCount?: number;
  compact?: boolean;
}> = ({ trackId, friendId, playlistCount, compact }) => {
  const track = useTrack(trackId, friendId);

  if (!track) {
    return null; // Track not yet loaded in store
  }

  const trackResult = (
    <TrackResultStore
      trackId={trackId}
      friendId={friendId}
      fallbackTrack={track}
      allowMinimize={false}
      playlistCount={playlistCount}
      buttons={[<TrackActionsMenu key="menu" track={track} />]}
      compact={compact}
    />
  );

  return trackResult;
};


const SearchResults: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = React.useMemo(
    () => searchParams?.toString() ?? "",
    [searchParams]
  );
  const { friend: currentUserFriend, setFriend, isHydrated } = useUsername();
  const { friends } = useFriendsQuery({
    showCurrentUser: true,
  });

  // Ensure tracks view is always scoped to a library unless user explicitly clears.
  React.useEffect(() => {
    if (!isHydrated) return;
    if (currentUserFriend) return;
    if (friends.length === 0) return;
    setFriend(friends[0]);
  }, [currentUserFriend, friends, setFriend, isHydrated]);

  // Filter state
  const [filters, setFilters] = React.useState<TracksFilter>(createEmptyFilters());
  const [filterModalOpen, setFilterModalOpen] = React.useState(false);
  const [appliedFilters, setAppliedFilters] = React.useState<TracksFilter>(createEmptyFilters());

  // Build MeiliSearch filter strings, combining with friend_id filter
  const meiliFilters = React.useMemo(() => {
    const customFilters = buildMeiliSearchFilters(appliedFilters);

    // Add friend_id filter if a friend is selected
    if (currentUserFriend?.id) {
      return [...customFilters, `friend_id = ${currentUserFriend.id}`];
    }

    return customFilters;
  }, [appliedFilters, currentUserFriend]);

  const {
    query,
    onQueryChange,
    estimatedResults,
    trackInfo,
    playlistCounts,
    hasMore,
    loadMore,
    initialLoading,
    loadingMore,
  } = useSearchResults({
    mode: "infinite",
    limit: 20,
    friend: currentUserFriend,
    filter: meiliFilters.length > 0 ? meiliFilters : undefined,
  });

  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = React.useState<"card" | "table">("card");
  const [compactMode, setCompactMode] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem("searchViewMode");
    if (saved === "card" || saved === "table") {
      setViewMode(saved);
    }
    const savedCompact = localStorage.getItem("searchCompactMode");
    if (savedCompact === "true") {
      setCompactMode(true);
    }
  }, []);

  const handleViewModeChange = (mode: "card" | "table") => {
    setViewMode(mode);
    localStorage.setItem("searchViewMode", mode);
  };

  const handleCompactModeToggle = () => {
    const newCompact = !compactMode;
    setCompactMode(newCompact);
    localStorage.setItem("searchCompactMode", String(newCompact));
  };

  // Filter handlers
  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setFilterModalOpen(false);

    // PostHog: Track filter application
    posthog.capture("search_filter_applied", {
      filter_count: getActiveFilterCount(filters),
      has_missing_audio: !!filters.missingAudio,
      has_missing_metadata: !!filters.missingMetadata,
      has_missing_any_streaming: !!filters.missingAnyStreamingUrl,
      has_missing_apple_music: !!filters.missingAppleMusic,
      has_missing_youtube: !!filters.missingYouTube,
      has_missing_soundcloud: !!filters.missingSoundCloud,
    });
  };

  const handleClearFilters = () => {
    const emptyFilters = createEmptyFilters();
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const activeFilterCount = getActiveFilterCount(appliedFilters);

  const observer = React.useRef<IntersectionObserver | null>(null);
  const bottomSentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!hasMore) return;
    if (!bottomSentinelRef.current) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore) {
        loadMore();
      }
    });
    observer.current.observe(bottomSentinelRef.current);
    return () => observer.current?.disconnect();
  }, [trackInfo.length, hasMore, loadMore, loadingMore]);

  // Debounced input state
  const [debouncedValue, setDebouncedValue] = React.useState(query);
  React.useEffect(() => {
    setDebouncedValue(query);
  }, [query]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (debouncedValue !== query) {
        // Only call if changed
        onQueryChange({
          target: { value: debouncedValue },
        } as React.ChangeEvent<HTMLInputElement>);

        // PostHog: Track search query execution
        if (debouncedValue.length > 0) {
          posthog.capture("search_query_executed", {
            query_length: debouncedValue.length,
            has_filters: activeFilterCount > 0,
            filter_count: activeFilterCount,
          });
        }
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [debouncedValue, onQueryChange, query, activeFilterCount]);

  // Hydrate query from URL (?q=...) on first mount
  React.useEffect(() => {
    const urlQ = searchParams?.get("q") ?? "";
    if (urlQ && urlQ !== debouncedValue) {
      setDebouncedValue(urlQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync when effective query changes
  React.useEffect(() => {
    if (!pathname) return;
    const params = new URLSearchParams(searchParamsString);
    if (query && query.length > 0) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    const nextQueryString = params.toString();
    if (nextQueryString === searchParamsString) return;
    const newUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
    router.replace(newUrl);
  }, [query, pathname, router, searchParamsString]);

  return (
    <Box mb={'100px'}>
      <UnifiedSearchControls
        query={debouncedValue}
        onQueryChange={setDebouncedValue}
        friends={friends}
        selectedFriend={currentUserFriend}
        onFriendChange={(friendId) => {
          const next = friends.find((f) => f.id === friendId) || null;
          setFriend(next);
        }}
        desktopControls={
          <>
            <Box position="relative">
              <IconButton
                aria-label="Filter tracks"
                size="sm"
                variant={activeFilterCount > 0 ? "solid" : "ghost"}
                colorPalette={activeFilterCount > 0 ? "blue" : undefined}
                onClick={() => setFilterModalOpen(true)}
              >
                <LuFilter />
              </IconButton>
              {activeFilterCount > 0 && (
                <Badge
                  position="absolute"
                  top="-1"
                  right="-1"
                  size="sm"
                  colorPalette="blue"
                  variant="solid"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Box>
            <IconButton
              aria-label="Card view"
              size="sm"
              variant={viewMode === "card" ? "solid" : "ghost"}
              onClick={() => handleViewModeChange("card")}
            >
              <LuLayoutGrid />
            </IconButton>
            <IconButton
              aria-label="Table view"
              size="sm"
              variant={viewMode === "table" ? "solid" : "ghost"}
              onClick={() => handleViewModeChange("table")}
            >
              <LuTable />
            </IconButton>
            {viewMode === "card" && (
              <IconButton
                aria-label={compactMode ? "Expand cards" : "Compact cards"}
                size="sm"
                variant={compactMode ? "solid" : "ghost"}
                onClick={handleCompactModeToggle}
              >
                {compactMode ? <LuMaximize2 /> : <LuMinimize2 />}
              </IconButton>
            )}
          </>
        }
        mobilePrimaryControl={
          <Box position="relative">
            <IconButton
              aria-label="Filter tracks"
              size="sm"
              variant={activeFilterCount > 0 ? "solid" : "ghost"}
              colorPalette={activeFilterCount > 0 ? "blue" : undefined}
              onClick={() => setFilterModalOpen(true)}
            >
              <LuFilter />
            </IconButton>
            {activeFilterCount > 0 && (
              <Badge
                position="absolute"
                top="-1"
                right="-1"
                size="sm"
                colorPalette="blue"
                variant="solid"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Box>
        }
        mobileSecondaryControls={
          <>
            <IconButton
              aria-label="Card view"
              size="sm"
              variant={viewMode === "card" ? "solid" : "ghost"}
              onClick={() => handleViewModeChange("card")}
            >
              <LuLayoutGrid />
            </IconButton>
            <IconButton
              aria-label="Table view"
              size="sm"
              variant={viewMode === "table" ? "solid" : "ghost"}
              onClick={() => handleViewModeChange("table")}
            >
              <LuTable />
            </IconButton>
            {viewMode === "card" && (
              <IconButton
                aria-label={compactMode ? "Expand cards" : "Compact cards"}
                size="sm"
                variant={compactMode ? "solid" : "ghost"}
                onClick={handleCompactModeToggle}
              >
                {compactMode ? <LuMaximize2 /> : <LuMinimize2 />}
              </IconButton>
            )}
          </>
        }
      />

      {/* Filter Modal */}
      <TracksFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {initialLoading ? (
        <Box mt={8}>
          {[...Array(8)].map((_, i) => (
            <Box key={i} mb={4}>
              <Box height="255px" borderRadius="md" bg="bg.muted" />
            </Box>
          ))}
        </Box>
      ) : (
        <>
          <Text fontSize="sm" color="gray.500" mb={2}>
            {estimatedResults.toLocaleString()} results found
            {activeFilterCount > 0 && (
              <Text as="span" color="blue.500" ml={2}>
                ({activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active)
              </Text>
            )}
          </Text>

          {viewMode === "card" ? (
            // Card view (existing)
            trackInfo.map((info) => {
              return (
                <TrackResultItem
                  key={`search-${info.trackId}-${info.friendId}`}
                  trackId={info.trackId}
                  friendId={info.friendId}
                  playlistCount={playlistCounts[`${info.trackId}:${info.friendId}`]}
                  compact={compactMode}
                />
              );
            })
          ) : (
            // Table view
            <>
              <TrackTableViewWithLoader
                trackInfo={trackInfo}
                playlistCounts={playlistCounts}
                buttons={(track) => <TrackActionsMenu track={track} />}
              />
            </>
          )}
          {hasMore && (
            <Box ref={bottomSentinelRef} height="1px" />
          )}
          {loadingMore && (
            <Flex justify="center" py={4}>
              <Spinner size="md" />
            </Flex>
          )}
        </>
      )}
      {/* End of results/infinite scroll */}
    </Box>
  );
};

export default SearchResults;
