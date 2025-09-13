"use client";

import React from "react";
import {
  Drawer,
  Box,
  Flex,
  Text,
  Button,
  EmptyState,
  VStack,
} from "@chakra-ui/react";
import { FiX, FiSave, FiTrash2 } from "react-icons/fi";
import { LuMusic } from "react-icons/lu";
import DraggableTrackList from "@/components/DraggableTrackList";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { useQueueSaveDialog } from "@/hooks/useQueueSaveDialog";
import type { Track } from "@/types/track";

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QueueDrawer({ isOpen, onClose }: QueueDrawerProps) {
  const {
    playlist,
    currentTrackIndex,
    moveTrackInQueue,
    removeFromQueue,
    clearQueue,
    playTrack,
  } = usePlaylistPlayer();

  // Use specialized save dialog for saving queue as playlist
  const { Dialog: SaveDialog, open: openSaveDialog } = useQueueSaveDialog();

  // Create track IDs array from playlist
  const trackIds = React.useMemo(() => {
    return playlist.map(track => track.track_id);
  }, [playlist]);

  // Render function for queue item buttons
  const renderQueueButtons = React.useCallback((track: Track | undefined, idx: number) => {
    if (!track) return null;

    const isCurrentTrack = idx === currentTrackIndex;
    
    return (
      <Flex gap={1} align="center">
        {!isCurrentTrack && (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => playTrack(idx)}
            colorPalette="blue"
          >
            Play
          </Button>
        )}
        <Button
          size="xs"
          variant="ghost"
          onClick={() => removeFromQueue(idx)}
          colorPalette="red"
        >
          <FiTrash2 />
        </Button>
      </Flex>
    );
  }, [currentTrackIndex, playTrack, removeFromQueue]);

  // Calculate total duration
  const totalDuration = React.useMemo(() => {
    const totalSeconds = playlist.reduce((sum, track) => {
      return sum + (track.duration_seconds || 0);
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }, [playlist]);

  return (
    <>
      <Drawer.Root 
        open={isOpen} 
        onOpenChange={({ open }) => !open && onClose()}
        placement="bottom"
        size="full"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            {/* Header */}
            <Drawer.Header borderBottomWidth="1px">
              <Flex justify="space-between" align="center" w="100%">
                <Box>
                  <Drawer.Title>Queue</Drawer.Title>
                  <Text fontSize="sm" color="fg.muted">
                    {playlist.length} tracks • {totalDuration}
                  </Text>
                </Box>
                <Flex gap={2} align="center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openSaveDialog}
                    disabled={playlist.length === 0}
                    leftIcon={<FiSave />}
                  >
                    Save as Playlist
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearQueue}
                    disabled={playlist.length === 0}
                    colorPalette="red"
                    leftIcon={<FiTrash2 />}
                  >
                    Clear Queue
                  </Button>
                  <Drawer.CloseTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <FiX />
                    </Button>
                  </Drawer.CloseTrigger>
                </Flex>
              </Flex>
            </Drawer.Header>

            {/* Body */}
            <Drawer.Body 
              px={0} 
              py={0}
              // Add bottom padding to prevent covering the player
              pb={{ base: "80px", md: "120px" }}
              maxH="70vh"
              overflowY="auto"
            >
              {playlist.length === 0 ? (
                <Box p={8}>
                  <EmptyState.Root size="sm">
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <LuMusic />
                      </EmptyState.Indicator>
                      <VStack textAlign="center">
                        <EmptyState.Title>Queue is empty</EmptyState.Title>
                        <EmptyState.Description>
                          Add tracks to your queue to see them here.
                        </EmptyState.Description>
                      </VStack>
                    </EmptyState.Content>
                  </EmptyState.Root>
                </Box>
              ) : (
                <Box px={4}>
                  <DraggableTrackList
                    trackIds={trackIds}
                    tracks={playlist}
                    moveTrack={moveTrackInQueue}
                    droppableId="queue-droppable"
                    renderTrackButtons={renderQueueButtons}
                    currentTrackIndex={currentTrackIndex}
                    trackResultProps={{
                      minimized: true,
                    }}
                  />
                </Box>
              )}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
      <SaveDialog />
    </>
  );
}