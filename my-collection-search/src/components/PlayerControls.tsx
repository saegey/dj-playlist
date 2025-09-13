"use client";

import React, { useMemo } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Image,
  Text,
  VStack,
  Slider,
  Icon,
} from "@chakra-ui/react";
import {
  FiPause,
  FiPlay,
  FiSkipBack,
  FiSkipForward,
  FiVolume2,
  FiVolume1,
  FiVolumeX,
  FiFilePlus,
  FiList,
} from "react-icons/fi";
import { Track } from "@/types/track";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";

const Artwork: React.FC<{ src?: string; alt?: string; size?: string }> = ({ 
  src, 
  alt, 
  size = "48px" 
}) => {
  if (!src) {
    return (
      <Box
        width={size}
        height={size}
        bg="bg.muted"
        borderRadius="md"
      />
    );
  }

  return (
    <Image
      src={src || "/images/placeholder-artwork.png"}
      alt={alt || "Artwork"}
      boxSize={size}
      objectFit="cover"
      borderRadius="md"
      borderWidth="1px"
    />
  );
};

interface PlayerControlsProps {
  /** Whether to show the queue button */
  showQueueButton?: boolean;
  /** Queue button click handler */
  onQueueToggle?: () => void;
  /** Whether queue is open (for button highlighting) */
  isQueueOpen?: boolean;
  /** Compact mode for drawer display */
  compact?: boolean;
  /** Whether to show volume controls */
  showVolumeControls?: boolean;
}

export default function PlayerControls({
  showQueueButton = true,
  onQueueToggle,
  isQueueOpen = false,
  compact = false,
  showVolumeControls = true,
}: PlayerControlsProps) {
  const {
    isPlaying,
    currentTrackIndex,
    currentTrack,
    currentTime,
    duration,
    seek,
    play,
    pause,
    playNext,
    playPrev,
    playlist,
    volume,
    setVolume,
  } = usePlaylistPlayer();

  const VolumeIcon = useMemo(() => {
    if (volume === 0) return FiVolumeX;
    if (volume < 0.5) return FiVolume1;
    return FiVolume2;
  }, [volume]);

  const safeLen = playlist.length;
  const safeIndex = currentTrackIndex;
  const canPrev = safeIndex !== null && safeIndex > 0;
  const canNext = safeIndex !== null && safeIndex < safeLen - 1;

  const progress = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.max(0, Math.min(100, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const fmt = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Box>
      {/* Playhead slider - only show if not compact */}
      {!compact && (
        <HStack gap={3} align="center" mb={2}>
          <Text fontSize="xs" minW="36px" textAlign="right" color="fg.muted">
            {fmt(currentTime || 0)}
          </Text>
          <Box flex="1">
            <Slider.Root
              width="100%"
              value={[progress]}
              onValueChange={(e) => {
                const pct = e.value[0] ?? 0;
                const target =
                  (Math.max(0, Math.min(100, pct)) / 100) * (duration || 0);
                if (Number.isFinite(target)) seek(target);
              }}
            >
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumbs rounded="full" />
              </Slider.Control>
            </Slider.Root>
          </Box>
          <Text fontSize="xs" minW="36px" color="fg.muted">
            {fmt(duration || 0)}
          </Text>
        </HStack>
      )}

      {/* Mobile track info - only in compact mode */}
      {compact && (
        <Flex mb={2}>
          <VStack
            align="start"
            gap={1}
            flex="1"
            minW={0}
            display={{ base: "flex", md: "none" }}
          >
            <Text
              fontWeight="semibold"
              fontSize="sm"
              maxW="100%"
            >
              {currentTrack ? currentTrack.title : "No track playing"}
            </Text>
            <Text
              color="fg.muted"
              fontSize="xs"
              maxW="100%"
            >
              {currentTrack ? currentTrack.artist : "—"}
            </Text>
          </VStack>
        </Flex>
      )}

      {/* Main controls */}
      <Flex
        align="center"
        gap={{ base: 3, md: 4 }}
        justify="space-between"
        minH={compact ? "48px" : "64px"}
      >
        {/* Left: Artwork + track info */}
        <HStack minW={0} gap={3} flex="1">
          <Artwork
            src={(currentTrack as Track)?.album_thumbnail}
            alt={
              currentTrack
                ? `${currentTrack.artist} - ${currentTrack.title}`
                : "Artwork"
            }
            size={compact ? "40px" : "48px"}
          />
          <VStack
            align="start"
            minW={0}
            display={compact ? "none" : { base: "none", md: "flex" }}
          >
            <Text
              fontWeight="semibold"
              fontSize={{ base: "sm", md: "md" }}
              maxW="40vw"
            >
              {currentTrack ? currentTrack.title : "No track playing"}
            </Text>
            <Text
              color="fg.muted"
              fontSize="xs"
              maxW="40vw"
            >
              {currentTrack ? currentTrack.artist : "—"}
            </Text>
          </VStack>
        </HStack>

        {/* Center: transport controls */}
        <HStack gap={{ base: 1, md: 2 }}>
          <IconButton
            aria-label="Previous"
            size="sm"
            variant="ghost"
            onClick={playPrev}
            disabled={!canPrev}
          >
            <FiSkipBack />
          </IconButton>

          {isPlaying ? (
            <Button
              aria-label="Pause"
              size="sm"
              variant="solid"
              colorScheme="red"
              onClick={pause}
            >
              <FiPause />
            </Button>
          ) : (
            <Button
              aria-label="Play"
              size="sm"
              variant="solid"
              colorScheme="green"
              onClick={play}
              disabled={safeLen === 0}
            >
              <FiPlay />
            </Button>
          )}

          <IconButton
            aria-label="Next"
            size="sm"
            variant="ghost"
            onClick={playNext}
            disabled={!canNext}
          >
            <FiSkipForward />
          </IconButton>
        </HStack>

        {/* Right: extras (volume / queue) */}
        <HStack gap={1} justify="flex-end" flex="1">
          {showVolumeControls && (
            <Box display={{ base: "none", md: "block" }}>
              <HStack align="center" gap={3}>
                <Icon
                  aria-label={volume === 0 ? "Unmute" : "Mute"}
                  size="sm"
                  onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                  cursor="pointer"
                >
                  <VolumeIcon />
                </Icon>
                <Slider.Root
                  width="200px"
                  value={[volume * 100]}
                  onValueChange={(e) => {
                    setVolume(e.value[0] / 100);
                  }}
                >
                  <Slider.Control>
                    <Slider.Track>
                      <Slider.Range />
                    </Slider.Track>
                    <Slider.Thumbs rounded="l1" />
                  </Slider.Control>
                </Slider.Root>
              </HStack>
            </Box>
          )}

          {showQueueButton && onQueueToggle && (
            <IconButton
              aria-label="Queue"
              size="sm"
              variant="ghost"
              title="Queue"
              onClick={onQueueToggle}
              colorPalette={isQueueOpen ? "blue" : undefined}
            >
              <FiList />
            </IconButton>
          )}
        </HStack>
      </Flex>

      {/* Progress bar for compact mode */}
      {compact && (
        <Box mt={2}>
          <Slider.Root
            width="100%"
            value={[progress]}
            onValueChange={(e) => {
              const pct = e.value[0] ?? 0;
              const target =
                (Math.max(0, Math.min(100, pct)) / 100) * (duration || 0);
              if (Number.isFinite(target)) seek(target);
            }}
          >
            <Slider.Control>
              <Slider.Track height="2px">
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumbs rounded="full" />
            </Slider.Control>
          </Slider.Root>
          <Flex justify="space-between" mt={1}>
            <Text fontSize="xs" color="fg.muted">
              {fmt(currentTime || 0)}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {fmt(duration || 0)}
            </Text>
          </Flex>
        </Box>
      )}
    </Box>
  );
}