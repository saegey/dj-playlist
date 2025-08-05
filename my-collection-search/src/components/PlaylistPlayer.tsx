// components/PlaylistPlayer.tsx
"use client";

import React from "react";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPause,
  FiPlay,
} from "react-icons/fi";
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
    <Box mt={2}>
      <Flex gap={2} alignItems="center" mb={2}>
        <Button
          size="sm"
          onClick={playPrev}
          disabled={currentTrackIndex === null || currentTrackIndex <= 0}
        >
          <FiChevronLeft />
        </Button>
        {isPlaying ? (
          <Button
            size="sm"
            colorScheme="red"
            onClick={pause}
            disabled={currentTrackIndex === null}
          >
            <FiPause />
          </Button>
        ) : (
          <Button
            size="sm"
            colorScheme="green"
            onClick={play}
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
        >
          <FiChevronRight />
        </Button>
      </Flex>
      {currentTrack && (
        <Text fontSize="sm" color="blue.500" ml={2}>
          Now Playing: {currentTrack.artist} - {currentTrack.title}
        </Text>
      )}
      <Box>{audioElement}</Box>
    </Box>
  );
};

export default PlaylistPlayer;