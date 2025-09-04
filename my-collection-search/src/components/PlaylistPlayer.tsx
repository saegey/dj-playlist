// components/PlaylistPlayer.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Image,
  Text,
  VStack,
  Popover,
  Tooltip,
  Slider,
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
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { Track } from "@/types/track";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { usePlaylistDrawer } from "@/providers/PlaylistDrawer";

const PlayerContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // translucent surface similar to YT Music
  const bg = "whiteAlpha.90";
  const border = "gray.200";

  return (
    <Box
      position="fixed"
      left={0}
      right={0}
      bottom={0}
      zIndex={100}
      bg={bg}
      backdropFilter="saturate(180%) blur(16px)"
      borderTopWidth="1px"
      borderColor={border}
      boxShadow="0 -6px 24px rgba(0,0,0,0.12)"
    >
      <Box
        maxW="1200px"
        mx="auto"
        px={{ base: 3, md: 6 }}
        py={{ base: 2, md: 3 }}
      >
        {children}
      </Box>
    </Box>
  );
};

const Artwork: React.FC<{ src?: string; alt?: string }> = ({ src, alt }) => (
  <Image
    src={src || "/images/placeholder-artwork.png"}
    alt={alt || "Artwork"}
    boxSize={{ base: "40px", md: "48px" }}
    objectFit="cover"
    borderRadius="md"
    borderWidth="1px"
  />
);

const PlaylistPlayer: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const {
    isPlaying,
    currentTrackIndex,
    currentTrack,
    play,
    pause,
    playNext,
    playPrev,
    playlist,
    volume,
    setVolume,
  } = usePlaylistPlayer();
  const { setOpen, isOpen } = usePlaylistDrawer();

  const VolumeIcon = useMemo(() => {
    if (volume === 0) return FiVolumeX;
    if (volume < 0.5) return FiVolume1;
    return FiVolume2;
  }, [volume]);

  const safeLen = mounted ? playlist.length : 0;
  const safeIndex = mounted ? currentTrackIndex : null;
  const canPrev = safeIndex !== null && safeIndex > 0;
  const canNext = safeIndex !== null && safeIndex < safeLen - 1;

  return (
    <>
      {/* Spacer so your page content isn't hidden behind the fixed bar */}
      <Box h={{ base: "72px", md: "84px" }} />

      {/* Remount internals when playlist changes to ensure fresh state */}
      <PlayerContainer>
        <Flex
          align="center"
          gap={{ base: 3, md: 4 }}
          justify="space-between"
          minH={{ base: "56px", md: "64px" }}
          zIndex={100}
        >
          {/* Left: Artwork + track info */}
          <HStack minW={0} gap={3} flex="1">
            <Artwork
              src={(currentTrack as Track)?.album_thumbnail}
              alt={
                mounted && currentTrack
                  ? `${currentTrack.artist} - ${currentTrack.title}`
                  : "Artwork"
              }
            />
            <VStack align="start" minW={0}>
              <Text
                fontWeight="semibold"
                fontSize={{ base: "sm", md: "md" }}
                // noOfLines={1}
                maxW={{ base: "45vw", md: "40vw" }}
              >
                {mounted && currentTrack
                  ? currentTrack.title
                  : "No track playing"}
              </Text>
              <Text
                color="fg.muted"
                fontSize="xs"
                // noOfLines={1}
                maxW={{ base: "45vw", md: "40vw" }}
              >
                {mounted && currentTrack ? currentTrack.artist : "—"}
              </Text>
            </VStack>
          </HStack>

          {/* Center: transport controls (YouTube Music vibe) */}
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
                disabled={!mounted || safeLen === 0}
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
            <Popover.Root>
              <Popover.Trigger>
                <span>
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      <span>
                        <IconButton
                          aria-label="Volume"
                          size="sm"
                          variant="ghost"
                        >
                          {React.createElement(VolumeIcon)}
                        </IconButton>
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Content>{`${Math.round(
                      volume * 100
                    )}%`}</Tooltip.Content>
                  </Tooltip.Root>
                </span>
              </Popover.Trigger>
              <Popover.Content w="240px" _focus={{ boxShadow: "lg" }}>
                <Popover.Body>
                  <HStack align="center" gap={3}>
                    <IconButton
                      aria-label={volume === 0 ? "Unmute" : "Mute"}
                      size="sm"
                      variant="ghost"
                      onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                    >
                      {volume === 0 ? <FiVolumeX /> : <VolumeIcon />}
                    </IconButton>
                    <Slider.Root
                      width="200px"
                      defaultValue={[40]}
                      onValueChange={(e) => {
                        setVolume(e.value[0] / 100);
                      }}
                    >
                      <HStack justify="space-between">
                        <Slider.Label>Volume</Slider.Label>
                        <Slider.ValueText />
                      </HStack>
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Range />
                        </Slider.Track>
                        <Slider.Thumbs rounded="l1" />
                      </Slider.Control>
                    </Slider.Root>
                  </HStack>
                </Popover.Body>
              </Popover.Content>
            </Popover.Root>

            <IconButton
              aria-label="Queue"
              size="sm"
              variant="ghost"
              title="Queue"
              onClick={() => setOpen(!isOpen)}
            >
              {isOpen ? <FiArrowDown /> : <FiArrowUp />}
            </IconButton>
          </HStack>
        </Flex>

        {/* audio element is mounted by PlaylistPlayerProvider; don't duplicate here */}
      </PlayerContainer>
    </>
  );
};

export default PlaylistPlayer;
