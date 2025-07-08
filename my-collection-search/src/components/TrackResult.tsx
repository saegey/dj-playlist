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
  footer?: React.ReactNode;
};

export default function TrackResult({
  track,
  buttons,
  minimized = false,
  allowMinimize = true,
  footer,
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
              {/* <Text fontSize="sm" fontWeight="bold">
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
              </Text> */}
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
          <Flex gap={4} alignItems="center">
            <Image
              src={track.album_thumbnail}
              alt={track.title}
              boxSize="50px"
              objectFit="cover"
              borderRadius="md"
            />
            <Box>
              <Flex flexDirection={"column"} gap={2}>
                <Flex>
                  <Text as="strong" fontSize="lg">
                    {track.title}
                  </Text>
                  <Text fontSize="md">— {track.artist}</Text>
                </Flex>
                <Text fontSize="sm" color="gray.600">
                  {track.album} ({track.year})
                </Text>
              </Flex>
            </Box>
          </Flex>

          <Flex flexDirection={"column"} gap={2} mt={2}>
            {track.styles && track.styles.length > 0 && (
              <Flex color="purple.600">
                <Text fontSize="sm" fontWeight={"bold"} color="purple.600">
                  Styles:{" "}
                </Text>
                <Text fontSize="sm" color="purple.600" ml={2}>
                  {track.styles.join(", ")}
                </Text>
              </Flex>
            )}
            {track.genres && track.genres.length > 0 && (
              <Flex gap={2} color="teal.600">
                <Text fontSize="sm" fontWeight={"bold"} color="teal.600">
                  Genres:{" "}
                </Text>
                <Text fontSize="sm" color="teal.600">
                  {track.genres.join(", ")}
                </Text>
              </Flex>
            )}
            {track.local_tags && track.local_tags.length > 0 && (
              <Flex gap={2} color="orange.600">
                <Text fontSize="sm" fontWeight={"bold"} color="orange.600">
                  Local Tags:{" "}
                </Text>
                <Text fontSize="sm" color="orange.600">
                  {Array.isArray(track.local_tags)
                    ? track.local_tags.join(", ")
                    : track.local_tags}
                </Text>
              </Flex>
            )}
            <Flex gap={2}>
              {/* <Text fontSize="sm">Track ID: {track.track_id}</Text> */}
              <Text fontSize="sm" fontWeight="bold">
                Position:{}
              </Text>
              <Text fontSize="sm">{track.position}</Text>
              <Text fontSize="sm" fontWeight="bold">
                Duration:{" "}
              </Text>
              <Text fontSize="sm">
                {track.duration
                  ? track.duration
                  : typeof track.duration_seconds === "number"
                  ? formatSeconds(track.duration_seconds)
                  : ""}
              </Text>
              {track.bpm && (
                <Flex gap={2}>
                  <Text fontSize="sm" fontWeight="bold">
                    BPM:{" "}
                  </Text>
                  <Text fontSize="sm">{track.bpm}</Text>
                </Flex>
              )}
            </Flex>
            {track.notes && <Text fontSize="sm">Notes: {track.notes}</Text>}
          </Flex>

          <Flex alignItems="center" gap={2} mt={2}>
            <Link
              href={track.discogs_url}
              color="blue.500"
              target="_blank"
              rel="noopener noreferrer"
              fontSize="sm"
            >
              Discogs
            </Link>
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
          </Flex>

          <Flex alignItems="flex-end" flexShrink={0} gap={2} mt={2}>
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
      {footer && <Box mt={2}>{footer}</Box>}
    </Box>
  );
}
