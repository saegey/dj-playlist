import React from "react";
import {
  Box,
  Input,
  Text,
  Button,
  Portal,
  Menu,
  InputGroup,
} from "@chakra-ui/react";
import TrackResult from "@/components/TrackResult";
import { Track } from "@/types/track";
import { FiMoreVertical } from "react-icons/fi";
import { LuSearch } from "react-icons/lu";
import UsernameSelect from "./UsernameSelect";
import { useFriendsQuery } from "@/hooks/useFriendsQuery";

interface SearchResultsProps {
  query: string;
  onQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  estimatedResults: number;
  results: Track[];
  playlistCounts: Record<string, number>;
  addToPlaylist: (track: Track) => void;
  handleEditClick: (track: Track) => void;
  hasMore: boolean;
  loadMore: () => void;
  loading?: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  onQueryChange: onQueryChangeProp,
  estimatedResults,
  results,
  playlistCounts,
  addToPlaylist,
  handleEditClick,
  hasMore,
  loadMore,
  loading = false,
}) => {
  const { friends } = useFriendsQuery({
    showCurrentUser: true,
    showSpotifyUsernames: true,
  });

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
        onQueryChangeProp({
          target: { value: debouncedValue },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [debouncedValue, onQueryChangeProp, query]);

  return (
    <Box>
      <Box display="flex" gap={3} mb={3}>
        <InputGroup startElement={<LuSearch size={16} />}>
          <Input
            placeholder="Search (name, genres, instruments, etc.)"
            value={debouncedValue}
            onChange={(e) => setDebouncedValue(e.target.value)}
            flex="1"
            variant={"subtle"}
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
                buttons={[
                  <Menu.Root key="menu">
                    <Menu.Trigger asChild>
                      <Button variant="plain" size={["xs", "sm", "md"]}>
                        <FiMoreVertical />
                      </Button>
                    </Menu.Trigger>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content>
                          <Menu.Item
                            onSelect={() => addToPlaylist(track)}
                            value="add"
                          >
                            Add to Playlist
                          </Menu.Item>
                          <Menu.Item
                            onSelect={() => handleEditClick(track)}
                            value="edit"
                          >
                            Edit Track
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>,
                ]}
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
