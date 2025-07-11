import React from "react";
import { Box, Input, Text, Button, MenuItem } from "@chakra-ui/react";
import TrackResult from "@/components/TrackResult";
import type { Track } from "@/types/track";

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
}) => {
  return (
    <Box width="40%">
      <Input
        type="text"
        placeholder="Search tracks..."
        value={query}
        onChange={onQueryChange}
        width="100%"
        mb={3}
      />
      <Text fontSize="sm" color="gray.500" mb={2}>
        {estimatedResults.toLocaleString()} results found
        {activeFilter && activeFilterType && (
          <>
            <Text as="span" color="purple.600" ml={2}>
              Filtered by {activeFilterType.charAt(0).toUpperCase() + activeFilterType.slice(1)}: <b>{activeFilter}</b>
            </Text>
            <Button
              size="xs"
              ml={2}
              onClick={clearFilter}
              colorScheme="gray"
              variant="outline"
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
            <MenuItem
              key="add"
              onClick={() => addToPlaylist(track)}
              color="#3182ce"
            >
              Add to Playlist
            </MenuItem>,
            <MenuItem
              key="edit"
              onClick={() => handleEditClick(track)}
              color="#4A5568"
            >
              Edit Track
            </MenuItem>,
          ]}
        />
      ))}
      {hasMore && (
        <Box textAlign="center" mt={4}>
          <Button onClick={loadMore}>Load More</Button>
        </Box>
      )}
    </Box>
  );
};

export default SearchResults;
