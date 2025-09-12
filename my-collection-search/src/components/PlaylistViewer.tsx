"use client";

import React from "react";
import { Box, EmptyState, Flex, Text, VStack } from "@chakra-ui/react";
import { FiHeadphones } from "react-icons/fi";
import TrackResultStore from "@/components/TrackResultStore";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";

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
    clearPlaylist,
    isGeneticSorting,
  } = usePlaylistMutations(playlistId);

  const { exportPlaylist, exportToPDF, getTotalPlaytime } =
    usePlaylistActions(playlistId);

  const { openTrackEditor } = useTrackEditor();
  const { Dialog: SaveDialog, open: openSaveDialog } =
    usePlaylistSaveDialog(playlistId);

  // Get total playtime for display
  const { formatted: totalPlaytimeFormatted } = getTotalPlaytime();

  // DnD handler must be declared before any early return to satisfy hooks rules
  const onDragEnd = React.useCallback(
    (result: DropResult) => {
      const { destination, source } = result;
      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      )
        return;
      moveTrack(source.index, destination.index);
    },
    [moveTrack]
  );

  if (trackIdsLoading || tracksLoading) {
    return <Box>Loading playlist...</Box>;
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
            onOpenSaveDialog={openSaveDialog}
            onClear={clearPlaylist}
            isGeneticSorting={isGeneticSorting}
          />
        </Flex>
      </Flex>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="playlist-droppable">
          {(provided: DroppableProvided) => (
            <Box
              overflowY="auto"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {trackIds.map((trackId, idx) => {
                // Find the track in the tracks array for fallback
                const track = tracks.find((t) => t.track_id === trackId);
                const username = track?.username || "default";
                const draggableKey = `${username}:${trackId}`;

                return (
                  <Draggable
                    key={draggableKey}
                    draggableId={draggableKey}
                    index={idx}
                  >
                    {(
                      dragProvided: DraggableProvided,
                      snapshot: DraggableStateSnapshot
                    ) => (
                      <Box
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        opacity={snapshot.isDragging ? 0.9 : 1}
                      >
                        <TrackResultStore
                          key={`playlist-${trackId}`}
                          trackId={trackId}
                          username={username}
                          fallbackTrack={track}
                          minimized
                          playlistCount={playlistCounts[trackId]}
                          buttons={[
                            track && (
                              <PlaylistItemMenu
                                key="menu"
                                idx={idx}
                                total={trackIds.length}
                                track={track} // Fallback for menu
                                moveTrack={moveTrack}
                                removeFromPlaylist={removeFromPlaylist}
                                openTrackEditor={openTrackEditor}
                                size="xs"
                              />
                            ),
                          ]}
                        />
                      </Box>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
              <PlaylistRecommendations
                playlist={tracks}
                onAddToPlaylist={addToPlaylist}
                onEditTrack={openTrackEditor}
              />
              <SaveDialog />
            </Box>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
};

export default PlaylistViewer;
