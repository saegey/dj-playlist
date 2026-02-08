"use client";
import React, { useState } from "react";
import ArtistLink from "./ArtistLink";
import AlbumLink from "./AlbumLink";
import {
  Box,
  Flex,
  Text,
  Link,
  Image,
  Button,
  Icon,
  RatingGroup,
  Badge,
} from "@chakra-ui/react";
import { SiDiscogs, SiApplemusic, SiYoutube, SiSpotify } from "react-icons/si";
import ExpandableMarkdown from "./ExpandableMarkdown";
import { Track } from "@/types/track";
import { FaPlay } from "react-icons/fa";
import { keyToCamelot } from "@/lib/playlistOrder";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";

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
  track: Track | (Track & { camelot_key?: string });
  buttons?: React.ReactNode;
  minimized?: boolean;
  allowMinimize?: boolean;
  footer?: React.ReactNode;
  playlistCount?: number;
  showUsername?: boolean; // Whether to show friend/username badge
};

export default function TrackResult({
  track,
  buttons,
  minimized = false,
  allowMinimize = true,
  footer,
  playlistCount,
  showUsername = true,
}: TrackResultProps) {
  const [expanded, setExpanded] = useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);
  const { replacePlaylist } = usePlaylistPlayer();

  // Prevent hydration mismatch: render a placeholder for minimized view until after mount
  if (minimized && !expanded && !hasMounted) {
    // Adjust minH to match your minimized card height for best results
    return <Box minH="56px" />;
  }
  // Minimized view (only render after mount to avoid hydration mismatch)
  if (minimized && !expanded && hasMounted) {
    return (
      <Box borderWidth="1px" borderRadius="md" p={3} mb={2} position="relative">
        <Flex alignItems="center" gap={2}>
          {/* Track summary (clickable to expand) */}
          <Box
            flex="1"
            cursor={allowMinimize ? "pointer" : undefined}
            onClick={allowMinimize ? () => setExpanded(true) : undefined}
          >
            <Text fontWeight="bold" fontSize={["sm", "sm", "sm"]}>
              {track.title}
            </Text>
            <Text fontSize="sm">
              <AlbumLink releaseId={track.release_id} friendId={track.friend_id} stopPropagation>
                {track.album}
              </AlbumLink>{" "}
              - {" "}
              <ArtistLink artist={track.artist} friendId={track.friend_id} stopPropagation>
                {track.artist}
              </ArtistLink>
            </Text>
            <Flex fontSize="sm" color="gray.600" gap={2} flexWrap="wrap" alignItems="center">
              {track.library_identifier && (
                <Badge colorPalette="blue" size="sm">
                  {track.library_identifier}
                </Badge>
              )}
              <Text>{formatSeconds(track.duration_seconds || 0)}</Text>
              <Text>{track.position}</Text>
              {track.bpm && <Text>{track.bpm} bpm</Text>}
              <Text>
                {track.key} - {keyToCamelot(track.key)}
              </Text>
              {showUsername && track.username && (
                <Text fontSize="sm">User: {track.username}</Text>
              )}
            </Flex>
          </Box>

          {/* Actions */}
          <Flex align="center">{buttons}</Flex>
        </Flex>
        {/* Floating Chevron Icon for expand */}
      </Box>
    );
  }

  const score =
    track._semanticScore !== undefined ? track._semanticScore * 100 : undefined;

  // Expanded view
  return (
    <Flex
      borderWidth={[0, "1px"]}
      borderBottomWidth={["1px", "1px"]}
      borderRadius={[0, "md"]}
      p={[0, 3]}
      mb={2}
      gap={3}
      position="relative"
      width={"100%"}
    >
      {/* Album Art with Play Overlay */}
      <Box
        position="relative"
        flexShrink={0}
        width={["70px", "80px", "90px"]}
        height={["70px", "80px", "90px"]}
      >
        {track.local_audio_url ? (
          <Box
            position="relative"
            borderRadius="md"
            overflow="hidden"
            cursor="pointer"
            width="100%"
            height="100%"
            tabIndex={0}
            onClick={() =>
              replacePlaylist([track], { autoplay: true, startIndex: 0 })
            }
            _hover={{ "& .overlay": { opacity: 1 } }}
          >
            <Image
              src={track.album_thumbnail}
              alt={track.title}
              width="100%"
              height="100%"
              objectFit="cover"
              borderRadius="md"
              transition="opacity 0.2s ease"
              draggable={false}
            />

            <Box
              className="overlay"
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              opacity={0}
              transition="opacity 0.15s ease"
              pointerEvents="none"
              bg="blackAlpha.500"
              borderRadius="md"
            >
              <Icon as={FaPlay} boxSize={8} color="white" />
            </Box>
          </Box>
        ) : (
          <Image
            src={track.album_thumbnail}
            alt={track.title}
            width="100%"
            height="100%"
            objectFit="cover"
            borderRadius="md"
          />
        )}
      </Box>

      {/* Main Content - Now using grid layout for better space utilization */}
      <Flex direction="column" flex={1} minW={0} gap={2}>
        {/* Row 1: Title, Artist, Album in a more compact layout */}
        <Box>
          <Flex alignItems="baseline" gap={2} flexWrap="wrap" pr={10}>
            <Text
              fontSize={["md", "lg", "lg"]}
              fontWeight="bold"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              flex="1 1 auto"
              minW="200px"
            >
              {track.title}
              {score && (
                <Badge
                  ml={2}
                  colorPalette={
                    score > 90 ? "green" : score > 75 ? "yellow" : "red"
                  }
                  size={["xs", "sm", "sm"]}
                >
                  {score.toFixed(1)}%
                </Badge>
              )}
            </Text>
          </Flex>
          <Flex gap={2} fontSize={["sm", "md", "md"]} color="gray.600" mt={0.5} flexWrap="wrap" alignItems="center" pr={10}>
            <ArtistLink artist={track.artist} friendId={track.friend_id}>
              <Text fontWeight="medium">{track.artist}</Text>
            </ArtistLink>
            <Text color="gray.400">•</Text>
            <Box overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" flex="1 1 auto" minW="150px">
              <AlbumLink releaseId={track.release_id} friendId={track.friend_id}>
                {track.release_id ? (
                  <Text as="span">
                    {track.album} {track.year && `(${track.year})`}
                  </Text>
                ) : (
                  <Text as="span">
                    {track.album} {track.year && `(${track.year})`}
                  </Text>
                )}
              </AlbumLink>
            </Box>
            <RatingGroup.Root value={track.star_rating ?? 0} readOnly size="xs">
              {Array.from({ length: 5 }).map((_, index) => (
                <RatingGroup.Item key={index} index={index + 1}>
                  <RatingGroup.ItemIndicator />
                </RatingGroup.Item>
              ))}
            </RatingGroup.Root>
            {showUsername && track.username && (
              <>
                <Text color="gray.400">•</Text>
                <Text fontSize="sm" color="gray.500">
                  {track.username}
                </Text>
              </>
            )}
            {typeof playlistCount === "number" && playlistCount > 0 && (
              <>
                <Text color="gray.400">•</Text>
                <Text fontSize="sm" color="gray.500">
                  {playlistCount} playlist{playlistCount === 1 ? "" : "s"}
                </Text>
              </>
            )}
          </Flex>
        </Box>

        {/* Row 2: Technical details and links on same line */}
        <Flex gap={4} fontSize={["xs", "sm", "sm"]} flexWrap="wrap" alignItems="center">
          {/* Technical Details */}
          <Flex gap={3} color="gray.600" flexWrap="wrap" alignItems="center">
            {track.library_identifier && (
              <Badge colorPalette="blue" size="sm" fontWeight="bold">
                {track.library_identifier}
              </Badge>
            )}
            {track.position && <Text>Pos: {track.position}</Text>}
            {track.duration_seconds && track.duration_seconds > 0 && (
              <Text>{formatSeconds(track.duration_seconds)}</Text>
            )}
            {track.bpm && <Text>{track.bpm} BPM</Text>}
            {track.key && (
              <Text>
                {track.key} ({keyToCamelot(track.key)})
              </Text>
            )}
            {track.danceability && <Text>Dance: {track.danceability}</Text>}
            {track.mood_happy && <Text>Happy: {track.mood_happy}</Text>}
            {track.mood_aggressive && <Text>Agg: {track.mood_aggressive}</Text>}
          </Flex>

          {/* Service Links - inline */}
          <Flex gap={2} ml="auto">
            {track.discogs_url && (
              <Link href={track.discogs_url} target="_blank" aria-label="Discogs">
                <SiDiscogs size={18} />
              </Link>
            )}
            {track.spotify_url && (
              <Link href={track.spotify_url} target="_blank" aria-label="Spotify">
                <SiSpotify size={18} />
              </Link>
            )}
            {track.apple_music_url && (
              <Link href={track.apple_music_url} target="_blank" aria-label="Apple Music">
                <SiApplemusic size={18} />
              </Link>
            )}
            {track.youtube_url && (
              <Link href={track.youtube_url} target="_blank" aria-label="YouTube">
                <SiYoutube size={18} />
              </Link>
            )}
          </Flex>
        </Flex>

        {/* Row 3: Genres/Styles */}
        {(Array.isArray(track.genres) && track.genres.length > 0) ||
        (Array.isArray(track.styles) && track.styles.length > 0) ||
        ((typeof track.local_tags === "string" &&
          track.local_tags !== "{}" &&
          track.local_tags !== "") ||
          (Array.isArray(track.local_tags) && track.local_tags.length > 0)) ? (
          <Flex gap={2} flexWrap="wrap">
            {Array.isArray(track.genres) &&
              track.genres.map((genre) => (
                <Badge key={genre} size={["xs", "sm", "sm"]} variant="surface">
                  {genre}
                </Badge>
              ))}
            {Array.isArray(track.styles) &&
              track.styles.map((style) => (
                <Badge key={style} size={["xs", "sm", "sm"]} variant="outline">
                  {style}
                </Badge>
              ))}
            {((typeof track.local_tags === "string" &&
              track.local_tags !== "{}" &&
              track.local_tags !== "") ||
              (Array.isArray(track.local_tags) &&
                track.local_tags.length > 0)) && (
              <Badge
                key={
                  Array.isArray(track.local_tags)
                    ? track.local_tags.join(",")
                    : track.local_tags
                }
                size={["xs", "sm", "sm"]}
                variant="solid"
              >
                {Array.isArray(track.local_tags)
                  ? track.local_tags.join(", ")
                  : track.local_tags}
              </Badge>
            )}
          </Flex>
        ) : null}

        {/* Row 4: Notes (if present) */}
        {track.notes && <ExpandableMarkdown text={track.notes} maxLength={100} />}

        {/* Hide button - only if minimizable */}
        {allowMinimize && (
          <Box>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setExpanded(false)}
            >
              Collapse
            </Button>
          </Box>
        )}
      </Flex>

      {/* Action Menu - Absolute positioned top-right */}
      <Box
        position="absolute"
        top={2}
        right={2}
        display="flex"
        gap={2}
      >
        {buttons}
      </Box>

      {/* Footer */}
      {footer && <Box mt={2} width="100%">{footer}</Box>}
    </Flex>
  );
}
