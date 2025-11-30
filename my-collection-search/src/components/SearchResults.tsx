"use client";

import React from "react";
import { Box, Input, Text, InputGroup, IconButton, Flex, Spinner } from "@chakra-ui/react";
import { LuSearch, LuLayoutGrid, LuTable, LuMaximize2, LuMinimize2 } from "react-icons/lu";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import TrackResultStore from "@/components/TrackResultStore";
import TrackTableViewWithLoader from "@/components/TrackTableViewWithLoader";
import UsernameSelect from "./UsernameSelect";
import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import { useSearchResults } from "@/hooks/useSearchResults";
import TrackActionsMenu from "@/components/TrackActionsMenu";
import { useTrack } from "@/hooks/useTrack";

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
  const { friends } = useFriendsQuery({
    showCurrentUser: true,
    showSpotifyUsernames: true,
  });
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
          </Text>

          {viewMode === "card" ? (
            // Card view (existing)
            trackInfo.map((info, idx) => {
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
