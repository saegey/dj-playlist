"use client";

import React from "react";
import {
  Box,
  EmptyState,
  Flex,
  Text,
  VStack,
  Skeleton,
} from "@chakra-ui/react";
import { FiHeadphones } from "react-icons/fi";

import DraggableTrackList from "@/components/DraggableTrackList";
import { useSearchResults } from "@/hooks/useSearchResults";
import { useTrackEditor } from "@/providers/TrackEditProvider";
import PlaylistItemMenu from "@/components/PlaylistItemMenu";
import { usePlaylistTrackIdsQuery } from "@/hooks/usePlaylistTrackIdsQuery";
import { usePlaylistTracksQuery } from "@/hooks/usePlaylistTracksQuery";
import PlaylistActionsMenu from "./PlaylistActionsMenu";
import { usePlaylistSaveDialog } from "@/hooks/usePlaylistSaveDialog";
import { usePlaylistMutations } from "@/hooks/usePlaylistMutations";
import { usePlaylistActions } from "@/hooks/usePlaylistActions";
import PlaylistRecommendations from "./PlaylistRecommendations";
import { Track } from "@/types/track";

const PlaylistViewer = ({ playlistId }: { playlistId?: number }) => {
  const { playlistCounts } = useSearchResults({});

  // New query-based hooks
  const { trackIds, isPending: trackIdsLoading } =
    usePlaylistTrackIdsQuery(playlistId);
  const { tracks, isPending: tracksLoading } = usePlaylistTracksQuery(
    trackIds,
    trackIds.length > 0
  );

  // New mutation and action hooks
  const {
    moveTrack,
    removeFromPlaylist,
    addToPlaylist,
    sortGreedy,
    sortGenetic,
    isGeneticSorting,
  } = usePlaylistMutations(playlistId);

  const { exportPlaylist, exportToPDF, getTotalPlaytime } =
    usePlaylistActions(playlistId);

  const { openTrackEditor } = useTrackEditor();
  const {
    Dialog: SaveDialog,
    open: openSaveDialog,
    saveExisting,
  } = usePlaylistSaveDialog(playlistId);

  // Get total playtime for display
  const { formatted: totalPlaytimeFormatted } = getTotalPlaytime();

  // Render function for playlist item menu buttons
  const renderPlaylistButtons = React.useCallback(
    (track: Track | undefined, idx: number) => {
      return track ? (
        <PlaylistItemMenu
          key="menu"
          idx={idx}
          total={trackIds.length}
          track={track}
          moveTrack={moveTrack}
          removeFromPlaylist={removeFromPlaylist}
          openTrackEditor={openTrackEditor}
          size="xs"
        />
      ) : null;
    },
    [trackIds.length, moveTrack, removeFromPlaylist, openTrackEditor]
  );

  if (trackIdsLoading || tracksLoading) {
    return (
      <Box>
        {/* Header skeleton */}
        <Flex align="flex-start" w="100%" pt={3} mb={2} gap={3}>
          <Box flex="1">
            <Skeleton height="20px" width="220px" mb={2} />
            <Skeleton height="14px" width="180px" />
          </Box>
          <Box>
            <Skeleton height="32px" width="40px" borderRadius="md" />
          </Box>
        </Flex>

        {/* List skeleton */}
        <Box>
          {Array.from({ length: 6 }).map((_, i) => (
            <Flex key={i} align="center" gap={3} py={2}>
              <Skeleton height="36px" width="36px" borderRadius="md" />
              <Box flex="1">
                <Skeleton
                  height="16px"
                  width={i % 3 === 0 ? "60%" : "75%"}
                  mb={1}
                />
                <Skeleton height="12px" width={i % 2 === 0 ? "35%" : "45%"} />
              </Box>
              <Skeleton height="28px" width="28px" borderRadius="full" />
            </Flex>
          ))}
        </Box>
      </Box>
    );
  }

  if (trackIds.length === 0) {
    return (
      <Box overflowY="auto">
        <EmptyState.Root size={"sm"}>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiHeadphones />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>Your playlist is empty</EmptyState.Title>
              <EmptyState.Description>
                Add tracks to your playlist to get started.
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      </Box>
    );
  }

  return (
    <>
      <Flex align="flex-start" w="100%" pt={3}>
        <Box>
          <Text>Playlist - {playlistId}</Text>
          <Text fontSize="sm" color="gray.500" mb={2}>
            Total Playtime: {totalPlaytimeFormatted}
            {/* Playlist Recommendations */}
          </Text>
        </Box>
        <Flex flexGrow={1} justify="flex-end" align="flex-start">
          <PlaylistActionsMenu
            disabled={trackIds.length === 0}
            onSortGreedy={() => {
              console.log("sort greed");
              sortGreedy();
            }}
            onSortGenetic={sortGenetic}
            onExportJson={exportPlaylist}
            onExportPdf={() => exportToPDF("playlist.pdf")}
            onOpenSaveDialog={playlistId ? saveExisting : openSaveDialog}
            isGeneticSorting={isGeneticSorting}
          />
        </Flex>
      </Flex>
      <Box overflowY="auto">
        <DraggableTrackList
          trackIds={trackIds}
          tracks={tracks}
          moveTrack={moveTrack}
          droppableId="playlist-droppable"
          renderTrackButtons={renderPlaylistButtons}
          trackResultProps={{
            minimized: true,
            playlistCount: playlistCounts,
          }}
        />
        <PlaylistRecommendations
          playlist={tracks}
          onAddToPlaylist={addToPlaylist}
          onEditTrack={openTrackEditor}
        />
        <SaveDialog />
      </Box>
    </>
  );
};

export default PlaylistViewer;
