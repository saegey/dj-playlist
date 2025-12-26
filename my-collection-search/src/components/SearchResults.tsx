"use client";

import React from "react";
import { Box, Input, Text, InputGroup, IconButton, Flex, Spinner, Badge } from "@chakra-ui/react";
import { LuSearch, LuLayoutGrid, LuTable, LuMaximize2, LuMinimize2, LuFilter } from "react-icons/lu";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import TrackResultStore from "@/components/TrackResultStore";
import TrackTableViewWithLoader from "@/components/TrackTableViewWithLoader";
import UsernameSelect from "./UsernameSelect";
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
  const { friend: currentUserFriend } = useUsername();
  const { friends } = useFriendsQuery({
    showCurrentUser: true,
    showSpotifyUsernames: true,
  });

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
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [debouncedValue, onQueryChange, query]);

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
    const params = new URLSearchParams(searchParams?.toString());
    if (query && query.length > 0) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl);
  }, [query, pathname, router, searchParams]);

  return (
    <Box mb={'100px'}>
      <Box display="flex" flexDirection={["column", "row"]} gap={3} mb={3}>
        <InputGroup startElement={<LuSearch size={16} />}>
          <Input
            placeholder="Search"
            value={debouncedValue}
            onChange={(e) => setDebouncedValue(e.target.value)}
            flex="1"
            variant={"subtle"}
            fontSize="16px"
          />
        </InputGroup>
        <UsernameSelect usernames={friends} />
        <Flex gap={1} alignItems="center">
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
        </Flex>
      </Box>

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
                  key={`search-${info.trackId}`}
                  trackId={info.trackId}
                  friendId={info.friendId}
                  playlistCount={playlistCounts[info.trackId]}
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
