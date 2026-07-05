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
  Image,
  IconButton,
  HStack,
  Slider,
  Portal,
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  FiX,
  FiSave,
  FiTrash2,
  FiPlay,
  FiPause,
  FiSkipBack,
  FiSkipForward,
  FiList,
  FiChevronDown,
} from "react-icons/fi";
import { LuMusic, LuVolume2 } from "react-icons/lu";
import DraggableTrackList from "@/components/DraggableTrackList";
import PlayerControls from "@/components/PlayerControls";
import { usePlaylistPlayer, usePlaylistPlayerTime } from "@/providers/PlaylistPlayerProvider";
import { useQueueSaveDialog } from "@/hooks/useQueueSaveDialog";
import { usePlayerControlsController } from "@/components/player/usePlayerControlsController";
import type { Track } from "@/types/track";
import { formatSeconds, getTrackDurationSeconds } from "@/lib/trackUtils";

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onQueueToggle: () => void;
  isQueueOpen: boolean;
}

type MobileView = "player" | "queue";

function QueueProgressSlider({
  duration,
  currentTime,
  onSeek,
}: {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => Promise<void>;
}) {
  const progress =
    duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0;

  return (
    <Box>
      <Slider.Root
        width="100%"
        value={[progress]}
        onValueChange={(e) => {
          const pct = e.value[0] ?? 0;
          const target = (Math.max(0, Math.min(100, pct)) / 100) * duration;
          if (Number.isFinite(target)) void onSeek(target);
        }}
        max={100}
        step={0.1}
      >
        <Slider.Control>
          <Slider.Track bg="whiteAlpha.300" height="6px" borderRadius="full">
            <Slider.Range bg="whiteAlpha.900" />
          </Slider.Track>
          <Slider.Thumbs rounded="full" bg="white" borderWidth="0" boxShadow="none" />
        </Slider.Control>
      </Slider.Root>
      <Flex justify="space-between" mt={1.5}>
        <Text fontSize="xs" color="whiteAlpha.900">
          {formatSeconds(currentTime || 0)}
        </Text>
        <Text fontSize="xs" color="whiteAlpha.900">
          -{formatSeconds(Math.max((duration || 0) - (currentTime || 0), 0))}
        </Text>
      </Flex>
    </Box>
  );
}

function MobileQueueList({
  playlist,
  currentTrackIndex,
  moveTrackInQueue,
  removeFromQueue,
  playTrack,
}: {
  playlist: Track[];
  currentTrackIndex: number | null;
  moveTrackInQueue: (fromIndex: number, toIndex: number) => void;
  removeFromQueue: (index: number) => void;
  playTrack: (index: number) => void;
}) {
  const tracksPlaylist = React.useMemo(() => {
    return playlist.map((track) => ({
      track_id: track.track_id,
      friend_id: track.friend_id,
    }));
  }, [playlist]);

  const renderQueueButtons = React.useCallback(
    (track: Track | undefined, idx: number) => {
      if (!track) return null;

      const isCurrentTrack = idx === currentTrackIndex;

      return (
        <Flex gap={1}>
          <IconButton
            aria-label="Remove track"
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={() => removeFromQueue(idx)}
          >
            <FiTrash2 />
          </IconButton>
        </Flex>
      );
    },
    [currentTrackIndex, playTrack, removeFromQueue]
  );

  return (
    <DraggableTrackList
      tracksPlaylist={tracksPlaylist}
      tracks={playlist}
      moveTrack={moveTrackInQueue}
      droppableId="queue-droppable"
      renderTrackButtons={renderQueueButtons}
      currentTrackIndex={currentTrackIndex}
      trackResultProps={{
        compact: true,
        compactVariant: "row",
        onRowClick: (_track, index) => playTrack(index),
      }}
    />
  );
}

export default function QueueDrawer({
  isOpen,
  onClose,
  onQueueToggle,
  isQueueOpen,
}: QueueDrawerProps) {
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const {
    playlist,
    currentTrack,
    currentTrackIndex,
    moveTrackInQueue,
    removeFromQueue,
    clearQueue,
    playTrack,
    volume,
    setVolume,
  } = usePlaylistPlayer();
  const { currentTime, duration } = usePlaylistPlayerTime();
  const {
    isPlaying,
    isAirPlayAvailable,
    safeLen,
    canPrev,
    canNext,
    handlePlay,
    handlePause,
    handleSeek,
    handleAirPlayClick,
    playPrev,
    playNext,
  } = usePlayerControlsController();
  const [mobileView, setMobileView] = React.useState<MobileView>("player");

  const { Dialog: SaveDialog, open: openSaveDialog } = useQueueSaveDialog();

  React.useEffect(() => {
    if (isOpen) {
      setMobileView("player");
    }
  }, [isOpen]);

  const totalDuration = React.useMemo(() => {
    const totalSeconds = playlist.reduce((sum, track) => {
      return sum + (getTrackDurationSeconds(track) || 0);
    }, 0);
    return formatSeconds(totalSeconds);
  }, [playlist]);

  const artworkSrc =
    currentTrack?.audio_file_album_art_url ||
    currentTrack?.album_thumbnail ||
    "/images/placeholder-artwork.png";

  if (!isMobile) {
    const tracksPlaylist = playlist.map((track) => ({
      track_id: track.track_id,
      friend_id: track.friend_id,
    }));

    const renderQueueButtons = (track: Track | undefined, idx: number) => {
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
    };

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
                          playlistMode: true,
                        }}
                      />
                    </Flex>
                    <Box h={{ base: "72px", md: "84px" }} />
                  </Container>
                )}
              </Drawer.Body>

              <Box
                borderTopWidth="1px"
                borderColor="border.muted"
                bg="bg.surface"
                px={4}
                py={3}
              >
                <PlayerControls
                  showQueueButton={true}
                  onQueueToggle={onQueueToggle}
                  isQueueOpen={isQueueOpen}
                  compact={false}
                  showVolumeControls={true}
                />
              </Box>
            </Drawer.Content>
          </Drawer.Positioner>
        </Drawer.Root>
        <SaveDialog />
      </>
    );
  }

  return (
    <>
      <Drawer.Root
        open={isOpen}
        onOpenChange={({ open }) => !open && onClose()}
        placement="bottom"
        size="full"
      >
        <Portal>
          <Drawer.Backdrop bg="blackAlpha.700" backdropFilter="blur(14px)" />
        </Portal>
        <Drawer.Positioner>
          <Drawer.Content
            display="flex"
            flexDirection="column"
            height="100%"
            bg="transparent"
            color="white"
            overflow="hidden"
          >
            <Box position="absolute" inset={0} bg="black" />
            <Box
              position="absolute"
              inset={0}
              bgImage={`url(${artworkSrc})`}
              bgSize="cover"
              bgPosition="center"
              filter="blur(36px)"
              transform="scale(1.12)"
              opacity={0.55}
            />
            <Box
              position="absolute"
              inset={0}
              bg="linear-gradient(180deg, rgba(25,18,18,0.70) 0%, rgba(34,16,9,0.58) 38%, rgba(19,17,21,0.92) 100%)"
            />

            <Drawer.Body
              position="relative"
              px={5}
              pt={4}
              pb={6}
              flex="1"
              display="flex"
              flexDirection="column"
              minH={0}
              overflow="hidden"
            >
              <Flex justify="center" align="center" position="relative" mb={4}>
                <IconButton
                  aria-label="Collapse player"
                  variant="ghost"
                  color="whiteAlpha.900"
                  position="absolute"
                  right={0}
                  top={0}
                  onClick={onClose}
                >
                  <FiX />
                </IconButton>
                <Button
                  variant="ghost"
                  color="whiteAlpha.800"
                  onClick={() => setMobileView(mobileView === "player" ? "queue" : "player")}
                  p={0}
                  minW="auto"
                  h="auto"
                >
                  <FiChevronDown size={24} />
                </Button>
              </Flex>

              {playlist.length === 0 ? (
                <Flex flex="1" align="center" justify="center">
                  <EmptyState.Root size="sm" colorPalette="gray">
                    <EmptyState.Content>
                      <EmptyState.Indicator color="whiteAlpha.700">
                        <LuMusic />
                      </EmptyState.Indicator>
                      <VStack textAlign="center">
                        <EmptyState.Title color="white">Queue is empty</EmptyState.Title>
                        <EmptyState.Description color="whiteAlpha.700">
                          Add tracks to your queue to start playback.
                        </EmptyState.Description>
                      </VStack>
                    </EmptyState.Content>
                  </EmptyState.Root>
                </Flex>
              ) : mobileView === "player" ? (
                <>
                  <Flex flex="1" direction="column" justify="space-between" minH={0}>
                    <Box>
                      <Image
                        src={artworkSrc}
                        alt={currentTrack ? `${currentTrack.artist} - ${currentTrack.title}` : "Artwork"}
                        w="100%"
                        maxW="min(100%, 420px)"
                        mx="auto"
                        aspectRatio={1}
                        objectFit="cover"
                        borderRadius="28px"
                        boxShadow="0 24px 64px rgba(0,0,0,0.28)"
                      />
                    </Box>

                    <VStack align="stretch" gap={4} mt={5}>
                      <Box minW={0} flex="1">
                        <Text fontWeight="bold" fontSize="xl" lineHeight="1.1" lineClamp={1}>
                          {currentTrack?.title ?? "No track playing"}
                        </Text>
                        <Text color="whiteAlpha.700" fontSize="lg" lineHeight="1.15" lineClamp={1}>
                          {currentTrack?.artist ?? "—"}
                        </Text>
                      </Box>

                      <QueueProgressSlider
                        duration={duration || 0}
                        currentTime={currentTime || 0}
                        onSeek={handleSeek}
                      />

                      <Flex justify="space-between" align="center" px={2} pt={1}>
                        <IconButton
                          aria-label="Previous"
                          variant="ghost"
                          color="white"
                          size="lg"
                          onClick={playPrev}
                          disabled={!canPrev}
                        >
                          <FiSkipBack size={32} />
                        </IconButton>
                        <IconButton
                          aria-label={isPlaying ? "Pause" : "Play"}
                          minW="84px"
                          h="84px"
                          borderRadius="full"
                          bg="transparent"
                          color="white"
                          onClick={isPlaying ? handlePause : handlePlay}
                          disabled={safeLen === 0}
                        >
                          {isPlaying ? <FiPause size={34} /> : <FiPlay size={34} />}
                        </IconButton>
                        <IconButton
                          aria-label="Next"
                          variant="ghost"
                          color="white"
                          size="lg"
                          onClick={playNext}
                          disabled={!canNext}
                        >
                          <FiSkipForward size={32} />
                        </IconButton>
                      </Flex>

                      <HStack gap={3} pt={1}>
                        <LuVolume2 size={20} />
                        <Slider.Root
                          flex="1"
                          value={[volume * 100]}
                          onValueChange={(e) => {
                            setVolume((e.value[0] ?? 0) / 100);
                          }}
                        >
                          <Slider.Control>
                            <Slider.Track bg="whiteAlpha.300" height="6px" borderRadius="full">
                              <Slider.Range bg="whiteAlpha.900" />
                            </Slider.Track>
                            <Slider.Thumbs rounded="full" bg="white" borderWidth="0" boxShadow="none" />
                          </Slider.Control>
                        </Slider.Root>
                      </HStack>

                      <Flex justify="space-between" align="center" pt={1}>
                        <Button
                          variant="ghost"
                          color="whiteAlpha.700"
                          size="sm"
                          onClick={openSaveDialog}
                          _hover={{ bg: "transparent", color: "white" }}
                          _active={{ bg: "transparent" }}
                        >
                          <HStack gap={2}>
                            <FiSave />
                            <Text fontSize="sm">Save</Text>
                          </HStack>
                        </Button>
                        <Button
                          variant="ghost"
                          color="whiteAlpha.900"
                          size="sm"
                          onClick={() => setMobileView("queue")}
                          _hover={{ bg: "transparent", color: "white" }}
                          _active={{ bg: "transparent" }}
                        >
                          <HStack gap={2}>
                            <FiList />
                            <Text fontSize="sm">Queue</Text>
                          </HStack>
                        </Button>
                        <Button
                          variant="ghost"
                          color={isAirPlayAvailable ? "whiteAlpha.900" : "whiteAlpha.500"}
                          size="sm"
                          onClick={handleAirPlayClick}
                          _hover={{
                            bg: "transparent",
                            color: "white",
                          }}
                          _active={{ bg: "transparent" }}
                        >
                          <Text fontSize="sm">AirPlay</Text>
                        </Button>
                      </Flex>
                    </VStack>
                  </Flex>
                </>
              ) : (
                <>
                  <Flex align="center" gap={3} mb={5}>
                    <Image
                      src={artworkSrc}
                      alt={currentTrack ? `${currentTrack.artist} - ${currentTrack.title}` : "Artwork"}
                      boxSize="72px"
                      borderRadius="xl"
                      objectFit="cover"
                    />
                    <Box minW={0} flex="1">
                      <Text fontWeight="bold" fontSize="xl" lineClamp={1}>
                        {currentTrack?.title ?? "No track playing"}
                      </Text>
                      <Text color="whiteAlpha.700" fontSize="lg" lineClamp={1}>
                        {currentTrack?.artist ?? "—"}
                      </Text>
                    </Box>
                    <HStack gap={1}>
                      <IconButton
                        aria-label="Save queue"
                        variant="ghost"
                        color="white"
                        onClick={openSaveDialog}
                      >
                        <FiSave />
                      </IconButton>
                      <IconButton
                        aria-label="Clear queue"
                        variant="ghost"
                        color="white"
                        onClick={clearQueue}
                      >
                        <FiTrash2 />
                      </IconButton>
                    </HStack>
                  </Flex>

                  <Flex justify="space-between" align="center" mb={5} px={1}>
                    <Box>
                      <Text fontWeight="bold" fontSize="xl">
                        Playing Next
                      </Text>
                      <Text color="whiteAlpha.700" fontSize="sm">
                        {playlist.length} tracks • {totalDuration}
                      </Text>
                    </Box>
                  </Flex>

                  <Box
                    flex="1"
                    minH={0}
                    overflowY="auto"
                    pr={1}
                    sx={{
                      "& [data-part='item']": {
                        background: "rgba(255,255,255,0.08)",
                        borderColor: "rgba(255,255,255,0.12)",
                      },
                    }}
                  >
                    <MobileQueueList
                      playlist={playlist}
                      currentTrackIndex={currentTrackIndex}
                      moveTrackInQueue={moveTrackInQueue}
                      removeFromQueue={removeFromQueue}
                      playTrack={playTrack}
                    />
                  </Box>

                  <Box pt={4}>
                    <QueueProgressSlider
                      duration={duration || 0}
                      currentTime={currentTime || 0}
                      onSeek={handleSeek}
                    />
                    <Flex justify="space-between" align="center" mt={4}>
                      <IconButton
                        aria-label="Previous"
                        variant="ghost"
                        color="white"
                        size="md"
                        onClick={playPrev}
                        disabled={!canPrev}
                      >
                        <FiSkipBack size={28} />
                      </IconButton>
                      <IconButton
                        aria-label={isPlaying ? "Pause" : "Play"}
                        minW="72px"
                        h="72px"
                        borderRadius="full"
                        bg="transparent"
                        color="white"
                        onClick={isPlaying ? handlePause : handlePlay}
                        disabled={safeLen === 0}
                      >
                        {isPlaying ? <FiPause size={30} /> : <FiPlay size={30} />}
                      </IconButton>
                      <IconButton
                        aria-label="Next"
                        variant="ghost"
                        color="white"
                        size="md"
                        onClick={playNext}
                        disabled={!canNext}
                      >
                        <FiSkipForward size={28} />
                      </IconButton>
                    </Flex>
                  </Box>
                </>
              )}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
      <SaveDialog />
    </>
  );
}
