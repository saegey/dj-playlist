"use client";

import { useState as useLocalState } from "react";
import { Box, Flex, Text, Link, Image, Button } from "@chakra-ui/react";
import { Track } from "@/app/page";

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
}

export type TrackResultProps = {
  track: Track;
  buttons?: React.ReactNode;
  minimized?: boolean;
  allowMinimize?: boolean;
};

export default function TrackResult({
  track,
  buttons,
  minimized = false,
  allowMinimize = true,
}: TrackResultProps) {
  const [expanded, setExpanded] = useLocalState(false);
  if (minimized && !expanded) {
    return (
      <Box borderWidth="1px" borderRadius="md" p={2} mb={2} bg="gray.50">
        <Flex alignItems="center" gap={2}>
          <Box>
            <Text fontWeight="bold">{track.title}</Text>
            <Text fontSize="sm">{track.artist}</Text>
            <Text fontSize="sm" color="gray.600">
              {track.album}
            </Text>
            <Flex direction="row" fontSize="sm" color="gray.600" gap={2}>
              <Text fontSize="sm" fontWeight="bold">
                Key:
              </Text>{" "}
              <Text fontSize="sm"> {track.key}</Text>
              <Text fontSize="sm" fontWeight="bold">
                BPM:{" "}
              </Text>
              <Text fontSize="sm">{track.bpm}</Text>
              <Text fontSize="sm" fontWeight="bold">
                Pos:
              </Text>
              <Text fontSize="sm">{track.position}</Text>
              <Text fontSize="sm" fontWeight="bold">
                Dur:
              </Text>
              <Text fontSize="sm"> {track.duration}</Text>
              <Text fontSize="sm" fontWeight="bold">
                AM Dur:{" "}
              </Text>
              <Text fontSize="sm">
                {formatSeconds(
                  track.duration_seconds ? track.duration_seconds : 0
                )}
              </Text>
            </Flex>
            {track.apple_music_url && (
              <Link
                href={track.apple_music_url}
                color="blue.500"
                target="_blank"
                rel="noopener noreferrer"
                fontSize="sm"
              >
                Apple Music
              </Link>
            )}
          </Box>

          <Flex flexGrow={1} justifyContent="flex-end">
            {allowMinimize && (
              <Button
                size="xs"
                variant="outline"
                ml={2}
                onClick={() => setExpanded(true)}
              >
                More
              </Button>
            )}
            {buttons}
          </Flex>
        </Flex>
      </Box>
    );
  }
  return (
    <Box borderWidth="1px" borderRadius="md" p={3} mb={2}>
      <Flex alignItems="center" gap={3} width="100%" minHeight="180px">
        <Flex direction="column" flex={1}>
          <Flex gap={4}>
            <Image
              src={track.album_thumbnail}
              alt={track.title}
              boxSize="50px"
              objectFit="cover"
              borderRadius="md"
            />
            <Box>
              <Text as="strong">{track.title}</Text> — {track.artist}
              <Text fontSize="sm">
                {track.album} ({track.year})
              </Text>
            </Box>
          </Flex>

          <Text fontSize="sm">Track ID: {track.track_id}</Text>
          <Text fontSize="sm">Position: {track.position}</Text>
          <Text fontSize="sm">
            Duration:{" "}
            {track.duration
              ? track.duration
              : typeof track.duration_seconds === "number"
              ? formatSeconds(track.duration_seconds)
              : ""}
          </Text>
          <Text fontSize="sm">Styles: {track.styles?.join(", ")}</Text>
          <Text fontSize="sm">Genres: {track.genres?.join(", ")}</Text>
          <Text fontSize="sm">Local Tags: {track.local_tags}</Text>
          <Text fontSize="sm">BPM: {track.bpm}</Text>
          <Text fontSize="sm">Key: {track.key}</Text>
          <Text fontSize="sm">Notes: {track.notes}</Text>
          <Flex alignItems="center" gap={2} mt={1}>
            <Link
              href={track.discogs_url}
              color="blue.500"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discogs
            </Link>
            {track.apple_music_url && (
              <Link
                href={track.apple_music_url}
                color="blue.500"
                target="_blank"
                rel="noopener noreferrer"
              >
                Apple Music
              </Link>
            )}
          </Flex>
          <br />
          <Flex alignItems="flex-end" flexShrink={0} gap={2}>
            {allowMinimize && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => setExpanded(false)}
              >
                Less
              </Button>
            )}
            {buttons}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}
