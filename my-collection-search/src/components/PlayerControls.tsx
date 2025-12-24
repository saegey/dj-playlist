"use client";

import React, { useMemo } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
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
  FiList,
} from "react-icons/fi";
import { Track } from "@/types/track";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import ProgressSlider from "@/components/player/ProgressSlider";
import CompactProgressSlider from "@/components/player/CompactProgressSlider";
import Artwork from "@/components/player/Artwork";
import ArtistLink from "./ArtistLink";
import AlbumLink from "./AlbumLink";
import PlaybackModeSelector from "@/components/PlaybackModeSelector";
import { usePlaybackMode, useLocalPlayback } from "@/hooks/usePlaybackMode";

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
    seek,
    play: browserPlay,
    pause: browserPause,
    playNext,
    playPrev,
    playlist,
    volume,
    setVolume,
  } = usePlaylistPlayer();

  const { mode, setMode } = usePlaybackMode();
  const localPlayback = useLocalPlayback();

  const VolumeIcon = useMemo(() => {
    if (volume === 0) return FiVolumeX;
    if (volume < 0.5) return FiVolume1;
    return FiVolume2;
  }, [volume]);

  const safeLen = playlist.length;
  const safeIndex = currentTrackIndex;
  const canPrev = safeIndex !== null && safeIndex > 0;
  const canNext = safeIndex !== null && safeIndex < safeLen - 1;

  // Handle play based on mode
  const handlePlay = async () => {
    if (mode === 'local-dac' && currentTrack?.local_audio_url) {
      try {
        await localPlayback.play(currentTrack.local_audio_url);
      } catch (error) {
        console.error('Local playback failed:', error);
        // Fall back to browser playback
        browserPlay();
      }
    } else {
      browserPlay();
    }
  };

  // Handle pause based on mode
  const handlePause = async () => {
    if (mode === 'local-dac') {
      try {
        await localPlayback.pause();
      } catch (error) {
        console.error('Local pause failed:', error);
      }
    }
    // Always pause browser playback too
    browserPause();
  };

  return (
    <Box>
      {/* Playhead slider - only show if not compact */}
      {!compact && <ProgressSlider seek={seek} />}

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
            <Text fontWeight="semibold" fontSize="sm" maxW="100%">
              {currentTrack ? currentTrack.title : "No track playing"}
            </Text>
            <Text color="fg.muted" fontSize="xs" maxW="100%">
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
          <AlbumLink
            releaseId={currentTrack?.release_id}
            friendId={currentTrack?.friend_id}
          >
            <Artwork
              src={(currentTrack as Track)?.album_thumbnail}
              alt={
                currentTrack
                  ? `${currentTrack.artist} - ${currentTrack.title}`
                  : "Artwork"
              }
              size={compact ? "40px" : "48px"}
            />
          </AlbumLink>
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
            <Text color="fg.muted" fontSize="xs" maxW="40vw">
              {currentTrack ? (
                <ArtistLink
                  artist={currentTrack.artist}
                  friendId={currentTrack.friend_id}
                >
                  {currentTrack.artist}
                </ArtistLink>
              ) : (
                "—"
              )}
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
              onClick={handlePause}
            >
              <FiPause />
            </Button>
          ) : (
            <Button
              aria-label="Play"
              size="sm"
              variant="solid"
              colorScheme="green"
              onClick={handlePlay}
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

        {/* Right: extras (playback mode, volume, queue) */}
        <HStack gap={1} justify="flex-end" flex="1">
          {/* Playback Mode Selector */}
          <Box display={{ base: "none", lg: "block" }}>
            <PlaybackModeSelector
              value={mode}
              onChange={setMode}
              disabled={isPlaying}
              compact={false}
            />
          </Box>

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
          <CompactProgressSlider seek={seek} />
        </Box>
      )}
    </Box>
  );
}
