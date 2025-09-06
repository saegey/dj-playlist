import React from "react";
import { Box, Input, Text, InputGroup } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";

import TrackResult from "@/components/TrackResult";
import UsernameSelect from "./UsernameSelect";
import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import { useSearchResults } from "@/hooks/useSearchResults";
import { useUsername } from "@/providers/UsernameProvider";
import { useMeili } from "@/providers/MeiliProvider";
import TrackActionsMenu from "@/components/TrackActionsMenu";

const SearchResults: React.FC = () => {
  const { friends } = useFriendsQuery({
    showCurrentUser: true,
    showSpotifyUsernames: true,
  });
  const { username: selectedUsername } = useUsername();
  const { client: meiliClient } = useMeili();
  const {
    query,
    onQueryChange,
    estimatedResults,
    results,
    playlistCounts,
    hasMore,
    loadMore,
    loading,
  } = useSearchResults({ client: meiliClient, username: selectedUsername });

  const lastResultRef = React.useRef<HTMLDivElement | null>(null);
  const observer = React.useRef<IntersectionObserver | null>(null);

  React.useEffect(() => {
    if (!hasMore) return;
    if (!lastResultRef.current) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    });
    observer.current.observe(lastResultRef.current);
    return () => observer.current?.disconnect();
  }, [results, hasMore, loadMore]);

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

  console.log("Rendering SearchResults with", {
    query,
    debouncedValue,
    results,
    estimatedResults,
    loading,
  });

  return (
    <Box>
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
      </Box>

      {loading ? (
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

          {results.map((track, idx) => {
            const isLast = idx === results.length - 1;
            const trackResult = (
              <TrackResult
                key={`search-${track.id}`}
                track={track}
                allowMinimize={false}
                playlistCount={playlistCounts[track.track_id]}
                buttons={[<TrackActionsMenu key="menu" track={track} />]}
              />
            );
            if (isLast) {
              return (
                <Box ref={lastResultRef} key={track.track_id}>
                  {trackResult}
                </Box>
              );
            }
            return trackResult;
          })}
        </>
      )}
      {/* End of results/infinite scroll */}
    </Box>
  );
};

export default SearchResults;
