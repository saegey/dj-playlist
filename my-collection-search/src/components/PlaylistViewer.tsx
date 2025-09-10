"use client";

import React from "react";
import { Box, EmptyState, VStack } from "@chakra-ui/react";
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

import {
  TrackCompat,
  TrackWithCamelot,
  // buildCompatibilityGraph,
  // greedyPath,
  keyToCamelot,
} from "@/lib/playlistOrder";
import { useSearchResults } from "@/hooks/useSearchResults";
import { useTrackEditor } from "@/providers/TrackEditProvider";
import PlaylistItemMenu from "@/components/PlaylistItemMenu";
// import { useGenerateGeneticPlaylistMutation } from "@/hooks/useGenerateGeneticPlaylistMutation";

const PlaylistViewer: React.FC = () => {
  const { playlistCounts } = useSearchResults({});
  const {
    playlist,
    moveTrack,
    removeFromPlaylist,
  } = usePlaylists();
  // const { mutateAsync: generateGenetic, isPending: generateGeneticLoading } =
  //   useGenerateGeneticPlaylistMutation();

  const { openTrackEditor } = useTrackEditor();

  // Compute greedy order
  // const updatedPlaylist: TrackWithCamelot[] = React.useMemo(() => {
  //   if (!playlist) return [];
  //   return playlist.map((track, idx) => {
  //     const t = track as TrackCompat;
  //     return {
  //       camelot_key: keyToCamelot(t.key),
  //       _vectors: t._vectors,
  //       energy: typeof t.energy === "number" ? t.energy : Number(t.energy) || 0,
  //       bpm: typeof t.bpm === "number" ? t.bpm : Number(t.bpm) || 0,
  //       idx,
  //     };
  //   });
  // }, [playlist]);

  // const compatibilityEdges = React.useMemo(
  //   () => buildCompatibilityGraph(updatedPlaylist),
  //   [updatedPlaylist]
  // );
  // const optimalPath = React.useMemo(
  //   () => greedyPath(updatedPlaylist, compatibilityEdges),
  //   [updatedPlaylist, compatibilityEdges]
  // );

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

  // Fetch genetic order if needed
  // React.useEffect(() => {
  //   if (optimalOrderType !== "genetic" || playlist.length === 0) return;
  //   let cancelled = false;
  //   (async () => {
  //     try {
  //       const result = await generateGenetic(playlist as Track[]);
  //       if (!cancelled) setDisplayPlaylist(result);
  //     } finally {
  //       if (!cancelled) {
  //         setOptimalOrderType("original");
  //       }
  //     }
  //   })();
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [
  //   optimalOrderType,
  //   playlist,
  //   setOptimalOrderType,
  //   generateGenetic,
  //   setDisplayPlaylist,
  // ]);

  // React.useEffect(() => {
  //   if (optimalOrderType === "greedy" && playlist.length > 0) {
  //     const greedyPlaylist = optimalPath.map(
  //       (orderIdx) => displayPlaylist[updatedPlaylist[orderIdx].idx]
  //     );
  //     setDisplayPlaylist(greedyPlaylist);
  //     setOptimalOrderType("original");
  //   }
  // }, [
  //   optimalOrderType,
  //   setOptimalOrderType,
  //   playlist,
  //   optimalPath,
  //   updatedPlaylist,
  //   setDisplayPlaylist,
  //   displayPlaylist,
  // ]);

  if (playlist.length === 0) {
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
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="playlist-droppable">
        {(provided: DroppableProvided) => (
          <Box
            overflowY="auto"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {playlist.map((track, idx) => (
              <Draggable
                key={`${track.username ?? ""}:${track.track_id}`}
                draggableId={`${track.username ?? ""}:${track.track_id}`}
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
                      key={`playlist-${track.track_id}`}
                      trackId={track.track_id}
                      username={track.username}
                      fallbackTrack={track}
                      minimized
                      playlistCount={playlistCounts[track.track_id]}
                      buttons={[
                        <PlaylistItemMenu
                          key="menu"
                          idx={idx}
                          total={playlist.length}
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
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default PlaylistViewer;
