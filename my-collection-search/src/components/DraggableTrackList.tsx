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
  trackIds: string[];
  /** Array of track objects for fallback */
  tracks: Track[];
  /** Function to move tracks within the list */
  moveTrack: (fromIndex: number, toIndex: number) => void;
  /** Unique ID for the droppable area */
  droppableId: string;
  /** Function to render action buttons for each track */
  renderTrackButtons?: (track: Track | undefined, index: number) => React.ReactNode;
  /** Additional props for TrackResultStore */
  trackResultProps?: {
    minimized?: boolean;
    playlistCount?: Record<string, number>;
  };
  /** Current playing track index (for highlighting) */
  currentTrackIndex?: number | null;
}

export default function DraggableTrackList({
  trackIds,
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
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {trackIds.map((trackId, idx) => {
              // Find the track in the tracks array for fallback
              const track = tracks.find(t => t.track_id === trackId);
              const username = track?.username || 'saegey';
              const draggableKey = `${username}:${trackId}`;
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
                        key={`${droppableId}-${trackId}`}
                        trackId={trackId}
                        username={username}
                        fallbackTrack={track}
                        buttons={renderTrackButtons ? [renderTrackButtons(track, idx)] : undefined}
                        minimized={trackResultProps?.minimized}
                        playlistCount={trackResultProps?.playlistCount?.[trackId]}
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