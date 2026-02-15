import {
  Box,
  VStack,
  HStack,
  Text,
  Slider,
  IconButton,
  Badge,
} from "@chakra-ui/react";
import { FaPlay, FaPause, FaStop } from "react-icons/fa";
import type { Track } from "@/types/track";
import type { DeckStatus } from "@/hooks/useAudioEngine";

interface DeckProps {
  label: "A" | "B";
  track: Track;
  status: DeckStatus;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onSeek: (time: number) => void;
}

export function Deck({
  label,
  track,
  status,
  onPlay,
  onPause,
  onStop,
  onVolumeChange,
  onPlaybackRateChange,
  onSeek,
}: DeckProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const bpmAdjusted = track.bpm
    ? (parseFloat(track.bpm) * status.playbackRate).toFixed(1)
    : "N/A";

  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      p={6}
      borderWidth={2}
      borderColor={label === "A" ? "blue.500" : "orange.500"}
    >
      <VStack align="stretch" gap={4}>
        {/* Header */}
        <HStack justify="space-between">
          <Badge
            colorScheme={label === "A" ? "blue" : "orange"}
            fontSize="lg"
            px={3}
            py={1}
          >
            Deck {label}
          </Badge>
          <Badge colorScheme="green" fontSize="md">
            {bpmAdjusted} BPM
          </Badge>
        </HStack>

        {/* Track Info */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" color="white" lineClamp={1}>
            {track.title}
          </Text>
          <Text fontSize="md" color="gray.400" lineClamp={1}>
            {track.artist}
          </Text>
          {track.key && (
            <Text fontSize="sm" color="gray.500">
              Key: {track.key}
            </Text>
          )}
        </Box>

        {/* Transport Controls */}
        <HStack justify="center" gap={2}>
          <IconButton
            aria-label="Play"
            onClick={onPlay}
            disabled={!status.isLoaded || status.isPlaying}
            colorScheme="green"
            size="lg"
          >
            <FaPlay />
          </IconButton>
          <IconButton
            aria-label="Pause"
            onClick={onPause}
            disabled={!status.isPlaying}
            colorScheme="yellow"
            size="lg"
          >
            <FaPause />
          </IconButton>
          <IconButton
            aria-label="Stop"
            onClick={onStop}
            disabled={!status.isLoaded}
            colorScheme="red"
            size="lg"
          >
            <FaStop />
          </IconButton>
        </HStack>

        {/* Time Display */}
        <HStack justify="space-between" fontSize="sm" color="gray.400">
          <Text>{formatTime(status.currentTime)}</Text>
          <Text>{formatTime(status.duration)}</Text>
        </HStack>

        {/* Seek Bar */}
        <Slider.Root
          value={[status.currentTime]}
          min={0}
          max={status.duration || 1}
          step={0.1}
          onValueChange={(e) => onSeek(e.value[0])}
          disabled={!status.isLoaded}
        >
          <Slider.Control>
            <Slider.Track bg="gray.700">
              <Slider.Range
                bg={label === "A" ? "blue.500" : "orange.500"}
              />
            </Slider.Track>
            <Slider.Thumbs />
          </Slider.Control>
        </Slider.Root>

        {/* Volume Control */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.400">
              Volume
            </Text>
            <Text fontSize="sm" color="white">
              {Math.round(status.volume * 100)}%
            </Text>
          </HStack>
          <Slider.Root
            value={[status.volume * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={(e) => onVolumeChange(e.value[0] / 100)}
          >
            <Slider.Control>
              <Slider.Track bg="gray.700">
                <Slider.Range bg="green.500" />
              </Slider.Track>
              <Slider.Thumbs />
            </Slider.Control>
          </Slider.Root>
        </Box>

        {/* Pitch/Tempo Control */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.400">
              Pitch/Tempo
            </Text>
            <HStack gap={2}>
              <Text fontSize="sm" color="white">
                {((status.playbackRate - 1) * 100).toFixed(1)}%
              </Text>
              <Badge
                colorScheme={Math.abs(status.playbackRate - 1) < 0.01 ? "green" : "yellow"}
                fontSize="xs"
              >
                {status.playbackRate.toFixed(2)}x
              </Badge>
            </HStack>
          </HStack>
          <Slider.Root
            value={[status.playbackRate * 100]}
            min={80}
            max={120}
            step={1}
            onValueChange={(e) => onPlaybackRateChange(e.value[0] / 100)}
          >
            <Slider.Control>
              <Slider.Track bg="gray.700">
                <Slider.Range bg="purple.500" />
              </Slider.Track>
              <Slider.Thumbs />
            </Slider.Control>
          </Slider.Root>
          <HStack justify="space-between" fontSize="xs" color="gray.500" mt={1}>
            <Text>-20%</Text>
            <Text>±0%</Text>
            <Text>+20%</Text>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
}
