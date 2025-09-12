"use client";

import React from "react";
import { Box, EmptyState, Flex, Text, VStack } from "@chakra-ui/react";
import { FiHeadphones } from "react-icons/fi";
import TrackResultStore from "@/components/TrackResultStore";
import { usePlaylists } from "@/providers/PlaylistsProvider";
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
import { exportPlaylistToPDF } from "@/lib/exportPlaylistPdf";
import { useSavePlaylistDialog } from "@/hooks/useSavePlaylistDialog";
// import { useGenerateGeneticPlaylistMutation } from "@/hooks/useGenerateGeneticPlaylistMutation";

const PlaylistViewer = ({ playlistId }: { playlistId?: number }) => {
  const { playlistCounts } = useSearchResults({});
  const {
    moveTrack,
    removeFromPlaylist,
    sortGreedy,
    sortGenetic,
    exportPlaylist,
    clearPlaylist,
  } = usePlaylists();
  const { openTrackEditor } = useTrackEditor();
  const { trackIds, isPending: trackIdsLoading } =
    usePlaylistTrackIdsQuery(playlistId);
  // Only fetch tracks once trackIds have been loaded and are non-empty
  const { tracks, isPending: tracksLoading } = usePlaylistTracksQuery(
    trackIds,
    trackIds.length > 0
  );
  const trackMap = React.useMemo(() => {
    const map: Record<string, (typeof tracks)[0]> = {};
    tracks.forEach((track) => {
      map[track.track_id] = { ...track, username: "saegey" };
    });
    return map;
  }, [tracks]);
  const { Dialog: SaveDialog, close: closeSaveDialog } =
    useSavePlaylistDialog();

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
  console.log("Rendering PlaylistViewer with playlist:", tracks, trackMap);

  console.log(
    "isPending:",
    trackIdsLoading,
    "trackIds:",
    trackIds,
    "tracks:",
    tracks
  );

  if (trackIdsLoading || tracksLoading) {
    return <Box>Loading playlist...</Box>;
  }

  if (tracks.length === 0) {
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
          <Text>Playlist</Text>
          <Text fontSize="sm" color="gray.500" mb={2}>
            Total Playtime: {"totalPlaytimeFormatted"}
            {/* Playlist Recommendations */}
          </Text>
        </Box>
        <Flex flexGrow={1} justify="flex-end" align="flex-start">
          <PlaylistActionsMenu
            disabled={tracks.length === 0}
            onSortGreedy={sortGreedy}
            onSortGenetic={sortGenetic}
            onExportJson={exportPlaylist}
            onExportPdf={() =>
              exportPlaylistToPDF({
                playlist: tracks,
                totalPlaytimeFormatted: "totalPlaytimeFormatted",
                filename: "playlist.pdf",
              })
            }
            onOpenSaveDialog={closeSaveDialog}
            onClear={clearPlaylist}
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
                const track = trackMap[trackId];
                if (!track) {
                  // Skeleton placeholder until track details load
                  return (
                    <Box
                      key={`placeholder-${trackId}`}
                      mb={2}
                      borderWidth="1px"
                      borderRadius="md"
                      minH="56px"
                    />
                  );
                }
                const draggableKey = `${track.username ?? ""}:${trackId}`;
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
                          fallbackTrack={track}
                          username={track.username}
                          minimized
                          playlistCount={playlistCounts[trackId]}
                          buttons={[
                            <PlaylistItemMenu
                              key="menu"
                              idx={idx}
                              total={trackIds.length}
                              track={track}
                              moveTrack={moveTrack}
                              removeFromPlaylist={removeFromPlaylist}
                              openTrackEditor={openTrackEditor}
                              size="xs"
                            />,
                          ]}
                        />
                      </Box>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
              <SaveDialog />
            </Box>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
};

export default PlaylistViewer;
