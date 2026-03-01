"use client";

import React from "react";
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
  FiList,
  FiCast,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import type { Track } from "@/types/track";
import type { PlaybackMode } from "@/services/internalApi/playback";
import ProgressSlider from "@/components/player/ProgressSlider";
import CompactProgressSlider from "@/components/player/CompactProgressSlider";
import Artwork from "@/components/player/Artwork";
import ArtistLink from "@/components/ArtistLink";
import AlbumLink from "@/components/AlbumLink";
import PlaybackModeSelector from "@/components/PlaybackModeSelector";

interface PlayerControlsViewProps {
  showQueueButton: boolean;
  onQueueToggle?: () => void;
  isQueueOpen: boolean;
  compact: boolean;
  showVolumeControls: boolean;
  isPlaying: boolean;
  currentTrack: Track | null;
  safeLen: number;
  canPrev: boolean;
  canNext: boolean;
  playPrev: () => void;
  playNext: () => void;
  mode: PlaybackMode;
  setMode: (mode: PlaybackMode) => void;
  volume: number;
  setVolume: (value: number) => void;
  VolumeIcon: IconType;
  isAirPlayAvailable: boolean;
  isAirPlayActive: boolean;
  onAirPlayClick: () => void;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => Promise<void>;
}

export default function PlayerControlsView({
  showQueueButton,
  onQueueToggle,
  isQueueOpen,
  compact,
  showVolumeControls,
  isPlaying,
  currentTrack,
  safeLen,
  canPrev,
  canNext,
  playPrev,
  playNext,
  mode,
  setMode,
  volume,
  setVolume,
  VolumeIcon,
  isAirPlayAvailable,
  isAirPlayActive,
  onAirPlayClick,
  onPlay,
  onPause,
  onSeek,
}: PlayerControlsViewProps) {
  const currentArtwork =
    currentTrack?.audio_file_album_art_url ||
    currentTrack?.album_thumbnail ||
    "/images/placeholder-artwork.png";

  return (
    <Box>
      {!compact && <ProgressSlider seek={onSeek} />}

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

      <Flex
        align="center"
        gap={{ base: 3, md: 4 }}
        justify="space-between"
        minH={compact ? "48px" : "64px"}
      >
        <HStack minW={0} gap={3} flex="1">
          <AlbumLink
            releaseId={currentTrack?.release_id}
            friendId={currentTrack?.friend_id}
          >
            <Artwork
              src={currentArtwork}
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
              onClick={onPause}
            >
              <FiPause />
            </Button>
          ) : (
            <Button
              aria-label="Play"
              size="sm"
              variant="solid"
              colorScheme="green"
              onClick={onPlay}
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

        <HStack gap={1} justify="flex-end" flex="1">
          <Box display={{ base: "block", md: "none" }}>
            <PlaybackModeSelector
              value={mode}
              onChange={setMode}
              disabled={isPlaying}
              compact={true}
            />
          </Box>
          <Box display={{ base: "none", md: "block" }}>
            <PlaybackModeSelector
              value={mode}
              onChange={setMode}
              disabled={isPlaying}
              compact={false}
            />
          </Box>

          {showVolumeControls && mode === "browser" && (
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

          {mode === "browser" && isAirPlayAvailable && (
            <IconButton
              aria-label="AirPlay"
              size="sm"
              variant={isAirPlayActive ? "solid" : "ghost"}
              colorPalette={isAirPlayActive ? "blue" : undefined}
              title="AirPlay"
              onClick={onAirPlayClick}
            >
              <FiCast />
            </IconButton>
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

      {compact && (
        <Box mt={2}>
          <CompactProgressSlider seek={onSeek} />
        </Box>
      )}
    </Box>
  );
}
