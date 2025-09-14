"use client";

import React from "react";
import { Box } from "@chakra-ui/react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import TrackResultStore from "@/components/TrackResultStore";
import { useDragAndDropList } from "@/hooks/useDragAndDropList";
import type { Track } from "@/types/track";

interface DraggableTrackListProps {
  /** Array of track IDs in order */
  tracksPlaylist: { track_id: string; friend_id: number }[];
  /** Array of track objects for fallback */
  tracks: Track[];
  /** Function to move tracks within the list */
  moveTrack: (fromIndex: number, toIndex: number) => void;
  /** Unique ID for the droppable area */
  droppableId: string;
  /** Function to render action buttons for each track */
  renderTrackButtons?: (
    track: Track | undefined,
    index: number
  ) => React.ReactNode;
  /** Additional props for TrackResultStore */
  trackResultProps?: {
    minimized?: boolean;
    playlistCount?: Record<string, number>;
  };
  /** Current playing track index (for highlighting) */
  currentTrackIndex?: number | null;
}

export default function DraggableTrackList({
  tracksPlaylist,
  tracks,
  moveTrack,
  droppableId,
  renderTrackButtons,
  trackResultProps = {},
  currentTrackIndex,
}: DraggableTrackListProps) {
  const { onDragEnd } = useDragAndDropList(moveTrack);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided: DroppableProvided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {tracksPlaylist.map((trackPlay, idx) => {
              // Find the track in the tracks array for fallback
              const track = tracks.find(
                (t) =>
                  t.track_id === trackPlay.track_id &&
                  t.friend_id === trackPlay.friend_id
              );
              const draggableKey = `${trackPlay.track_id}:${trackPlay.friend_id}`;
              const isCurrentTrack = currentTrackIndex === idx;

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
                      bg={isCurrentTrack ? "bg.muted" : undefined}
                      borderRadius={isCurrentTrack ? "md" : undefined}
                    >
                      <TrackResultStore
                        key={`${droppableId}-${trackPlay.track_id}:${trackPlay.friend_id}`}
                        trackId={trackPlay.track_id}
                        friendId={trackPlay.friend_id}
                        fallbackTrack={track}
                        buttons={
                          renderTrackButtons
                            ? [renderTrackButtons(track, idx)]
                            : undefined
                        }
                        minimized={trackResultProps?.minimized}
                        playlistCount={
                          trackResultProps?.playlistCount?.[trackPlay.track_id]
                        }
                      />
                    </Box>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
}
