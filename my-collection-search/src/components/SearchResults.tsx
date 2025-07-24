import React from "react";
import { useFriends } from "@/hooks/useFriends";
import { Box, Input, Text, Button, Portal, Menu } from "@chakra-ui/react";
import { useUsernameSelect } from "@/hooks/useUsernameSelect";
import TrackResult from "@/components/TrackResult";
import { Track } from "@/types/track";
import { FiMoreVertical } from "react-icons/fi";

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
  selectedUsername?: string;
  onUsernameChange?: (username: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  onQueryChange,
  estimatedResults,
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
  const UsernameSelect = useUsernameSelect({
    usernames: friends,
    selectedUsername,
    setSelectedUsername: onUsernameChange || (() => {}),
    size: ["sm", "md", "md"],
    variant: "subtle",
    width: "120px",
  });

  return (
    <Box>
      <Box display="flex" gap={3} mb={3}>
        <Input
          placeholder="Search tracks..."
          value={query}
          onChange={onQueryChange}
          flex="1"
          variant={"subtle"}
        />
        {friendsLoading ? (
          <Text>Loading friends...</Text>
        ) : friends.length > 0 && onUsernameChange ? (
          UsernameSelect
        ) : null}
      </Box>

      <Text fontSize="sm" color="gray.500" mb={2}>
        {estimatedResults.toLocaleString()} results found
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
