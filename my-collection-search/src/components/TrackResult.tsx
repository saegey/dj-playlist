"use client";


import {
  Box,
  Flex,
  Text,
  Link,
  Image,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from "@chakra-ui/react";
import { FiMoreVertical } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import { Track } from "@/types/track";
import { useState } from "react";
import ExpandableMarkdown from "./ExpandableMarkdown";

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
  playlistCount?: number; // Number of playlists this track appears in
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
  if (minimized && !expanded) {
    return (
      <Box borderWidth="1px" borderRadius="md" p={2} mb={2} bg="gray.50">
        <Flex alignItems="center" gap={2}>
          <Box>
            <Text fontWeight="bold">{track.title}</Text>
            <Text fontSize="sm">{track.artist}</Text>
            {/* <Text fontSize="sm" color="gray.600">
              {track.album}
            </Text> */}
            <Flex direction="row" fontSize="sm" color="gray.600" gap={2}>
              <Text fontSize="sm">
                {track.duration_seconds
                  ? formatSeconds(track.duration_seconds)
                  : track.duration}
              </Text>
              <Text fontSize="sm">{track.position}</Text>
              {track.bpm && <Text fontSize="sm">{track.bpm}bpm</Text>}
              <Text fontSize="sm">{track.key}</Text>
              {track.danceability && (
                <Text fontSize="sm">{track.danceability} DANCE</Text>
              )}
              {typeof playlistCount === "number" && (
                <Text fontSize="sm" color="purple.600">
                  In {playlistCount} playlist{playlistCount === 1 ? "" : "s"}
                </Text>
              )}
            </Flex>

            <Flex direction="row" fontSize="sm" color="gray.600" gap={2}>
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
              {track.youtube_url && (
                <Link
                  href={track.youtube_url}
                  color="blue.500"
                  target="_blank"
                  rel="noopener noreferrer"
                  fontSize="sm"
                >
                  Youtube
                </Link>
              )}
              {track.username && (
                <Text fontSize="sm" color="gray.500" ml={2}>
                  User: {track.username}
                </Text>
              )}
            </Flex>
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
            {buttons && (
              <Menu placement="bottom-end">
                <MenuButton
                  as={IconButton}
                  aria-label="Actions"
                  icon={<FiMoreVertical size={"20px"} />}
                  size="sm"
                  variant="ghost"
                  ml={2}
                />
                <MenuList minW="120px">{buttons}</MenuList>
              </Menu>
            )}
          </Flex>
        </Flex>
      </Box>
    );
  }
  return (
    <Box borderWidth="1px" borderRadius="md" p={3} mb={2}>
      <Flex alignItems="center" gap={3} width="100%" minHeight="180px">
        <Flex direction="column" flex={1}>
          <Flex gap={4} alignItems="top">
            <Image
              src={track.album_thumbnail}
              alt={track.title}
              boxSize="100px"
              objectFit="cover"
              borderRadius="md"
            />
            <Box>
              <Flex flexDirection={"column"} gap={0}>
                <Text as="strong" fontSize="lg">
                  {track.title}
                </Text>
                <Text fontSize="md">{track.artist}</Text>
                <Text fontSize="sm" color="gray.600">
                  {track.album} ({track.year})
                </Text>
                <Flex gap={2} alignItems="center" mt={1}>
                  <Flex color={"black.600"} alignItems="center">
                    {[...Array(5)].map((_, i) => (
                      <Box
                        as="span"
                        key={i}
                        color={
                          i < (track.star_rating || 0)
                            ? "black.500"
                            : "gray.300"
                        }
                        fontSize="md"
                        ml={0}
                      >
                        ★
                      </Box>
                    ))}
                  </Flex>
                  {typeof playlistCount === "number" && (
                    <Text fontSize="sm" color="purple.600" mt={1}>
                      In {playlistCount} playlist
                      {playlistCount === 1 ? "" : "s"}
                    </Text>
                  )}
                </Flex>
              </Flex>
            </Box>
            <Box flexGrow={1} textAlign="right">
              {buttons && (
                <Menu placement="bottom-end">
                  <MenuButton
                    as={IconButton}
                    aria-label="Actions"
                    icon={<FiMoreVertical size={"20px"} />}
                    size="sm"
                    variant="ghost"
                  />
                  <MenuList minW="120px">
                    {Array.isArray(buttons) ? (
                      buttons.map((btn, idx) => (
                        <MenuItem as="div" key={idx} px={1} py={1}>
                          {btn}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem as="div">{buttons}</MenuItem>
                    )}
                  </MenuList>
                </Menu>
              )}
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
                Pos{}
              </Text>
              <Text fontSize="sm">{track.position}</Text>
              <Text fontSize="sm" fontWeight="bold">
                Dur{" "}
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
                    BPM{" "}
                  </Text>
                  <Text fontSize="sm">{track.bpm}</Text>
                </Flex>
              )}
              {track.key && (
                <Flex gap={2}>
                  <Text fontSize="sm" fontWeight="bold">
                    Key{" "}
                  </Text>
                  <Text fontSize="sm">{track.key}</Text>
                </Flex>
              )}
              {track.danceability && (
                <Flex gap={2}>
                  <Text fontSize="sm" fontWeight="bold">
                    Dance{" "}
                  </Text>
                  <Text fontSize="sm">{track.danceability}</Text>
                </Flex>
              )}
              {track.mood_happy && (
                <Flex gap={2}>
                  <Text fontSize="sm" fontWeight="bold">
                    Happy{" "}
                  </Text>
                  <Text fontSize="sm">{track.mood_happy}</Text>
                </Flex>
              )}
              {track.mood_aggressive && (
                <Flex gap={2}>
                  <Text fontSize="sm" fontWeight="bold">
                    Agg{" "}
                  </Text>
                  <Text fontSize="sm">{track.mood_aggressive}</Text>
                </Flex>
              )}
            </Flex>
            {track.notes && (
              <Box mt={1}>
                <ExpandableMarkdown text={track.notes} maxLength={100} />
              </Box>
            )}

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
              {track.youtube_url && (
                <Link
                  href={track.youtube_url}
                  color="blue.500"
                  target="_blank"
                  rel="noopener noreferrer"
                  fontSize="sm"
                >
                  Youtube
                </Link>
              )}
              {track.username && (
                <Text fontSize="sm" color="gray.500" ml={2}>
                  User: {track.username}
                </Text>
              )}
              {/* Audio player for local file */}
            </Flex>
            <Flex width="100%" mt={2}>
              {track.local_audio_url && (
                <Box flex={1}>
                  <audio controls style={{ width: "100%" }}>
                    <source src={track.local_audio_url} type="audio/mp4" />
                    Your browser does not support the audio element.
                  </audio>
                </Box>
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
            </Flex>
          </Flex>
        </Flex>
      </Flex>
      {footer && <Box mt={2}>{footer}</Box>}
    </Box>
  );
}
