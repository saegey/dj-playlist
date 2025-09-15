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
  Container,
} from "@chakra-ui/react";
import { FiX, FiSave, FiTrash2, FiPlay } from "react-icons/fi";
import { LuMusic } from "react-icons/lu";
import DraggableTrackList from "@/components/DraggableTrackList";
import PlayerControls from "@/components/PlayerControls";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { useQueueSaveDialog } from "@/hooks/useQueueSaveDialog";
import type { Track } from "@/types/track";
import { PlayerContainer } from "./PlaylistPlayer";

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onQueueToggle: () => void;
  isQueueOpen: boolean;
}

export default function QueueDrawer({
  isOpen,
  onClose,
  onQueueToggle,
  isQueueOpen,
}: QueueDrawerProps) {
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
  const tracksPlaylist = React.useMemo(() => {
    return playlist.map((track) => {
      return { track_id: track.track_id, friend_id: track.friend_id };
    });
  }, [playlist]);

  // Render function for queue item buttons
  const renderQueueButtons = React.useCallback(
    (track: Track | undefined, idx: number) => {
      if (!track) return null;

      const isCurrentTrack = idx === currentTrackIndex;

      return (
        <Flex gap={1} alignItems="right">
          {!isCurrentTrack && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => playTrack(idx)}
              colorPalette="blue"
            >
              <FiPlay />
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
    },
    [currentTrackIndex, playTrack, removeFromQueue]
  );

  // Calculate total duration
  const totalDuration = React.useMemo(() => {
    const totalSeconds = playlist.reduce((sum, track) => {
      return sum + (track.duration_seconds || 0);
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
          <Drawer.Content display="flex" flexDirection="column" height="100%">
            {/* Queue Actions Header */}
            <Drawer.Header borderBottomWidth="1px" py={3} mt={9}>
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
                  >
                    <FiSave />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearQueue}
                    disabled={playlist.length === 0}
                    colorPalette="red"
                  >
                    <FiTrash2 />
                    Clear
                  </Button>
                  <Drawer.CloseTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <FiX />
                    </Button>
                  </Drawer.CloseTrigger>
                </Flex>
              </Flex>
            </Drawer.Header>

            {/* Body fills space between header and bottom player */}
            <Drawer.Body
              px={0}
              py={0}
              flex="1"
              display="flex"
              flexDirection="column"
              overflow="hidden"
              minH={0}
              alignItems={"center"}
            >
              {playlist.length === 0 ? (
                <Box
                  flex="1"
                  minH={0}
                  overflowY="auto"
                  maxW={["8xl", "2xl", "2xl"]}
                  pt={3}
                >
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
                <Container
                  minH={0}
                  overflowY="auto"
                  maxW={["8xl", "2xl", "2xl"]}
                  pt={3}
                  alignItems={"center"}
                >
                  <Flex
                    p={[0, 3]}
                    mb={2}
                    flexDirection="column"
                    flexGrow={1}
                    minHeight={0}
                    width={"100%"}
                  >
                    <DraggableTrackList
                      tracksPlaylist={tracksPlaylist}
                      tracks={playlist}
                      moveTrack={moveTrackInQueue}
                      droppableId="queue-droppable"
                      renderTrackButtons={renderQueueButtons}
                      currentTrackIndex={currentTrackIndex}
                      trackResultProps={{
                        minimized: true,
                      }}
                    />
                  </Flex>
                  <Box h={{ base: "72px", md: "84px" }} />
                </Container>
              )}
            </Drawer.Body>

            {/* Bottom pinned player */}
            <Box
              borderTopWidth="1px"
              borderColor="border.muted"
              bg="bg.surface"
              p={4}
            >
              <PlayerContainer>
                <PlayerControls
                  showQueueButton={true}
                  onQueueToggle={onQueueToggle}
                  isQueueOpen={isQueueOpen}
                  compact={false}
                  showVolumeControls={true}
                />
              </PlayerContainer>
            </Box>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
      <SaveDialog />
    </>
  );
}
