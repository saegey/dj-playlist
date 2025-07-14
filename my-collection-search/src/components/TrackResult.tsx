"use client";
import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Link,
  Image,
  Button,
  Portal,
  Menu,
  MenuItem,
  IconButton,
} from "@chakra-ui/react";
import { FiMoreVertical } from "react-icons/fi";
import ExpandableMarkdown from "./ExpandableMarkdown";
import { Track } from "@/types/track";

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export type TrackResultProps = {
  track: Track;
  buttons?: React.ReactNode;
  minimized?: boolean;
  allowMinimize?: boolean;
  footer?: React.ReactNode;
  playlistCount?: number;
};

export default function TrackResult({
  track,
  buttons,
  minimized = false,
  allowMinimize = true,
  footer,
  playlistCount,
}: TrackResultProps) {
  const [expanded, setExpanded] = useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  // Prevent hydration mismatch: render a placeholder for minimized view until after mount
  if (minimized && !expanded && !hasMounted) {
    // Adjust minH to match your minimized card height for best results
    return <Box minH="56px" />;
  }
  // Minimized view (only render after mount to avoid hydration mismatch)
  if (minimized && !expanded && hasMounted) {
    return (
      <Box
        borderWidth="1px"
        borderRadius="md"
        p={2}
        mb={2}
        bg={{ base: "gray.50", _dark: "gray.800" }}
      >
        <Flex alignItems="center" gap={2}>
          {/* Track summary */}
          <Box flex="1">
            <Text fontWeight="bold">{track.title}</Text>
            <Text fontSize="sm">{track.artist}</Text>
            <Flex fontSize="sm" color="gray.600" gap={2}>
              <Text>{formatSeconds(track.duration_seconds || 0)}</Text>
              <Text>{track.position}</Text>
              {track.bpm && <Text>{track.bpm} bpm</Text>}
              <Text>{track.key}</Text>
              {track.danceability && <Text>{track.danceability} DANCE</Text>}
              {typeof playlistCount === "number" && (
                <Text color="purple.600">
                  In {playlistCount} playlist
                  {playlistCount === 1 ? "" : "s"}
                </Text>
              )}
            </Flex>
            <Flex fontSize="sm" color="gray.600" gap={2}>
              <Link href={track.discogs_url} color="blue.500" target="_blank">
                Discogs
              </Link>
              {track.apple_music_url && (
                <Link
                  href={track.apple_music_url}
                  color="blue.500"
                  target="_blank"
                >
                  Apple Music
                </Link>
              )}
              {track.youtube_url && (
                <Link href={track.youtube_url} color="blue.500" target="_blank">
                  YouTube
                </Link>
              )}
              {track.username && (
                <Text fontSize="sm" color="gray.500">
                  User: {track.username}
                </Text>
              )}
            </Flex>
          </Box>

          {/* Actions */}
          <Flex align="center">
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

  // Expanded view
  return (
    <Box borderWidth="1px" borderRadius="md" p={3} mb={2}>
      <Flex alignItems="center" gap={3}>
        <Image
          src={track.album_thumbnail}
          alt={track.title}
          boxSize="100px"
          objectFit="cover"
          borderRadius="md"
        />

        <Flex direction="column" flex={1}>
          <Text fontSize="lg" fontWeight="bold">
            {track.title}
          </Text>
          <Text fontSize="md">{track.artist}</Text>
          <Text fontSize="sm" color="gray.600">
            {track.album} ({track.year})
          </Text>

          <Flex alignItems="center" gap={2} mt={1}>
            {[...Array(5)].map((_, i) => (
              <Box
                key={i}
                as="span"
                fontSize="md"
                color={i < (track.star_rating || 0) ? "black.500" : "gray.300"}
              >
                ★
              </Box>
            ))}
            {typeof playlistCount === "number" && (
              <Text fontSize="sm" color="purple.600" mt={1}>
                In {playlistCount} playlist{playlistCount === 1 ? "" : "s"}
              </Text>
            )}
          </Flex>

          {/* Styles, genres, tags */}
          {Array.isArray(track.styles) && track.styles.length > 0 && (
            <Text fontSize="sm" color="purple.600">
              Styles: {track.styles.join(", ")}
            </Text>
          )}
          {Array.isArray(track.genres) && track.genres.length > 0 && (
            <Text fontSize="sm" color="teal.600">
              Genres: {track.genres.join(", ")}
            </Text>
          )}
          {Array.isArray(track.local_tags) && track.local_tags.length > 0 && (
            <Text fontSize="sm" color="orange.600">
              Local Tags: {track.local_tags.join(", ")}
            </Text>
          )}

          {/* Details line */}
          <Flex flexWrap="wrap" gap={4} mt={2}>
            <Text fontSize="sm">
              <strong>Pos:</strong> {track.position}
            </Text>
            <Text fontSize="sm">
              <strong>Dur:</strong> {formatSeconds(track.duration_seconds || 0)}
            </Text>
            {track.bpm && (
              <Text fontSize="sm">
                <strong>BPM:</strong> {track.bpm}
              </Text>
            )}
            {track.key && (
              <Text fontSize="sm">
                <strong>Key:</strong> {track.key}
              </Text>
            )}
            {track.danceability && (
              <Text fontSize="sm">
                <strong>Dance:</strong> {track.danceability}
              </Text>
            )}
            {track.mood_happy && (
              <Text fontSize="sm">
                <strong>Happy:</strong> {track.mood_happy}
              </Text>
            )}
            {track.mood_aggressive && (
              <Text fontSize="sm">
                <strong>Agg:</strong> {track.mood_aggressive}
              </Text>
            )}
          </Flex>

          {track.notes && (
            <Box mt={2}>
              <ExpandableMarkdown text={track.notes} maxLength={100} />
            </Box>
          )}

          {/* Links and audio */}
          <Flex gap={2} mt={2}>
            <Link href={track.discogs_url} color="blue.500" target="_blank">
              Discogs
            </Link>
            {track.apple_music_url && (
              <Link
                href={track.apple_music_url}
                color="blue.500"
                target="_blank"
              >
                Apple Music
              </Link>
            )}
            {track.youtube_url && (
              <Link href={track.youtube_url} color="blue.500" target="_blank">
                YouTube
              </Link>
            )}
            {track.username && (
              <Text fontSize="sm" color="gray.500">
                User: {track.username}
              </Text>
            )}
          </Flex>

          {track.local_audio_url && (
            <Box mt={2}>
              <audio controls style={{ width: "100%" }}>
                <source src={track.local_audio_url} type="audio/mp4" />
              </audio>
            </Box>
          )}

          {/* Minimize button */}
          <Flex justifyContent="flex-end" mt={2}>
            {allowMinimize && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => setExpanded(false)}
              >
                Less
              </Button>
            )}
          </Flex>
        </Flex>

        {/* Action menu */}
        {buttons}
      </Flex>

      {footer && <Box mt={2}>{footer}</Box>}
    </Box>
  );
}
