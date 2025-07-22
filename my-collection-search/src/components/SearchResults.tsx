import React from "react";
import { useFriends } from "@/hooks/useFriends";
import {
  Box,
  Input,
  Text,
  Button,
  Portal,
  Select,
  createListCollection,
  Menu,
} from "@chakra-ui/react";
import TrackResult from "@/components/TrackResult";
import { Track } from "@/types/track";
import { FiMoreVertical } from "react-icons/fi";

interface SearchResultsProps {
  query: string;
  onQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  estimatedResults: number;
  activeFilter: string | null;
  activeFilterType: "genre" | "style" | "artist" | null;
  clearFilter: () => void;
  results: Track[];
  playlistCounts: Record<string, number>;
  addToPlaylist: (track: Track) => void;
  handleEditClick: (track: Track) => void;
  hasMore: boolean;
  loadMore: () => void;
  selectedUsername?: string;
  onUsernameChange?: (username: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
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
  selectedUsername = "",
  onUsernameChange,
}) => {
  const { friends, loading: friendsLoading } = useFriends();
  const usernameCollection = createListCollection({
    items: friends.map((u) => ({ label: u, value: u })),
  });

  return (
    <Box width="40%">
      <Box display="flex" gap={3} mb={3}>
        <Input
          placeholder="Search tracks..."
          value={query}
          onChange={onQueryChange}
          flex="1"
        />
        {friendsLoading ? (
          <Text>Loading friends...</Text>
        ) : friends.length > 0 && onUsernameChange ? (
          <Select.Root
            collection={usernameCollection}
            value={selectedUsername ? [selectedUsername] : []}
            onValueChange={(vals) => {
              onUsernameChange(vals.value.length ? vals.value[0] : "");
            }}
            width="320px"
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Choose user library" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {friends.map((u) => (
                    <Select.Item item={{ label: u, value: u }} key={u}>
                      {u}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        ) : null}
      </Box>

      <Text fontSize="sm" color="gray.500" mb={2}>
        {estimatedResults.toLocaleString()} results found
        {activeFilter && activeFilterType && (
          <>
            <Text as="span" color="purple.600" ml={2}>
              Filtered by{" "}
              {activeFilterType.charAt(0).toUpperCase() +
                activeFilterType.slice(1)}
              : <b>{activeFilter}</b>
            </Text>
            <Button
              size="xs"
              ml={2}
              variant="outline"
              colorScheme="gray"
              onClick={clearFilter}
            >
              Clear Filter
            </Button>
          </>
        )}
      </Text>

      {results.map((track) => (
        <TrackResult
          key={track.track_id}
          track={track}
          allowMinimize={false}
          playlistCount={playlistCounts[track.track_id]}
          buttons={[
            <Menu.Root key="menu">
              <Menu.Trigger asChild>
                <Button variant="outline" size="xs">
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
      ))}

      {hasMore && (
        <Box textAlign="center" mt={4}>
          <Button onClick={loadMore} colorScheme="purple">
            Load More
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default SearchResults;
