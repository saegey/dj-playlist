// components/PlaylistPlayer.tsx
"use client";

import React from "react";
import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
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
    <Stack mt={2} bg="bg.subtle" p={4} borderRadius="md" borderWidth="1px">
      {/* {currentTrack && ( */}
      <Text fontSize="sm" ml={2}>
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
    </Stack>
  );
};

export default PlaylistPlayer;
