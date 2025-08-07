// components/PlaylistPlayer.tsx
"use client";

import React from "react";
import { Box, Button, Flex, Text, VStack } from "@chakra-ui/react";
import { FiPause, FiPlay, FiSkipBack, FiSkipForward } from "react-icons/fi";
import { usePlaylistPlayer } from "@/hooks/usePlaylistPlayer";
import type { Track } from "@/types/track";

interface PlaylistPlayerProps {
  playlist: Track[];
}

const PlaylistPlayer: React.FC<PlaylistPlayerProps> = ({ playlist }) => {
  const {
    isPlaying,
    currentTrackIndex,
    currentTrack,
    play,
    pause,
    playNext,
    playPrev,
    audioElement,
  } = usePlaylistPlayer(playlist);

  return (
    <VStack
      mt={2}
      bg="bg.subtle"
      p={2}
      borderRadius="md"
      borderWidth="1px"
      w="100%"
      maxW="100%"
      overflowX="hidden"
    >
      {/* {currentTrack && ( */}
      <Text fontSize="sm" ml={2} truncate as="div">
        {currentTrack
          ? `${currentTrack.artist} - ${currentTrack.title}`
          : "No track playing"}
      </Text>
      {/* )} */}
      <Flex gap={2} alignItems="center" mb={2}>
        <Button
          size="sm"
          onClick={playPrev}
          variant={"ghost"}
          disabled={currentTrackIndex === null || currentTrackIndex <= 0}
        >
          <FiSkipBack />
        </Button>
        {isPlaying ? (
          <Button
            size="sm"
            colorScheme="red"
            onClick={pause}
            variant={"ghost"}
            disabled={currentTrackIndex === null}
          >
            <FiPause />
          </Button>
        ) : (
          <Button
            size="sm"
            colorScheme="green"
            onClick={play}
            variant={"ghost"}
            disabled={playlist.length === 0}
          >
            <FiPlay />
          </Button>
        )}
        <Button
          size="sm"
          onClick={playNext}
          disabled={
            currentTrackIndex === null ||
            currentTrackIndex >= playlist.length - 1
          }
          variant={"ghost"}
        >
          <FiSkipForward />
        </Button>
      </Flex>

      <Box>{audioElement}</Box>
    </VStack>
  );
};

export default PlaylistPlayer;
