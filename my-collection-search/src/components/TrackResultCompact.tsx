"use client";
import React from "react";
import {
  Box,
  Flex,
  Text,
  Link,
  Image,
  Icon,
  RatingGroup,
  Badge,
} from "@chakra-ui/react";
import { SiDiscogs, SiApplemusic, SiYoutube, SiSpotify, SiSoundcloud } from "react-icons/si";
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

export type TrackResultCompactProps = {
  track: Track | (Track & { camelot_key?: string });
  buttons?: React.ReactNode;
  footer?: React.ReactNode;
  playlistCount?: number;
};

export default function TrackResultCompact({
  track,
  buttons,
  footer,
  playlistCount,
}: TrackResultCompactProps) {
  const { replacePlaylist } = usePlaylistPlayer();

  const score =
    track._semanticScore !== undefined ? track._semanticScore * 100 : undefined;

  // Collect all genres and styles
  const genres = Array.isArray(track.genres) ? track.genres : [];
  const styles = Array.isArray(track.styles) ? track.styles : [];
  const allGenres = [...genres, ...styles];

  // Collect technical details
  const details: Array<{ icon: string; value: string | number }> = [];
  if (track.position) {
    details.push({ icon: "Pos", value: track.position });
  }
  if (track.duration_seconds && track.duration_seconds > 0) {
    details.push({ icon: "⏱", value: formatSeconds(track.duration_seconds) });
  }
  if (track.bpm) {
    details.push({ icon: "♫", value: `${track.bpm}` });
  }
  if (track.key) {
    details.push({ icon: "♪", value: `${track.key} (${keyToCamelot(track.key)})` });
  }
  if (track.danceability) {
    details.push({ icon: "💃", value: track.danceability });
  }

  return (
    <Flex
      borderWidth={[0, "1px"]}
      borderBottomWidth={["1px", "1px"]}
      borderRadius={[0, "md"]}
      p={[2, 3]}
      mb={2}
      gap={3}
      position="relative"
      width="100%"
      _hover={{ bg: "bg.muted" }}
      transition="background 0.2s"
    >
      {/* Album Art with Play Overlay */}
      <Box
        position="relative"
        flexShrink={0}
        width={["60px", "70px", "80px"]}
        height={["60px", "70px", "80px"]}
      >
        {track.local_audio_url ? (
          <Box
            position="relative"
            borderRadius="md"
            overflow="hidden"
            cursor="pointer"
            width="100%"
            height="100%"
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
              bg="blackAlpha.600"
              borderRadius="md"
            >
              <Icon as={FaPlay} boxSize={6} color="white" />
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

      {/* Main Content Area */}
      <Flex direction="column" flex={1} minW={0} gap={1}>
        {/* Row 1: Title, Artist, Rating */}
        <Flex alignItems="center" gap={2} flexWrap="wrap" pr={"60px"}>
          <Text
            fontSize={["md", "md", "lg"]}
            fontWeight="bold"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            flex="1"
            minW="150px"
          >
            {track.title}
            {score && (
              <Badge
                ml={2}
                colorPalette={
                  score > 90 ? "green" : score > 75 ? "yellow" : "red"
                }
                size="xs"
              >
                {score.toFixed(0)}%
              </Badge>
            )}
          </Text>

          <RatingGroup.Root value={track.star_rating ?? 0} readOnly size="xs">
            {Array.from({ length: 5 }).map((_, index) => (
              <RatingGroup.Item key={index} index={index + 1}>
                <RatingGroup.ItemIndicator />
              </RatingGroup.Item>
            ))}
          </RatingGroup.Root>
        </Flex>

        {/* Row 2: Artist, Album, Year */}
        <Flex gap={2} fontSize={["sm", "sm", "md"]} color="gray.600" flexWrap="wrap" alignItems="center">
          <Text fontWeight="medium">{track.artist}</Text>
          <Text color="gray.400">•</Text>
          <Text>
            {track.album} {track.year && `(${track.year})`}
          </Text>
          {track.username && (
            <>
              <Text color="gray.400">•</Text>
              <Text fontSize="xs" color="gray.500">
                {track.username}
              </Text>
            </>
          )}
          {typeof playlistCount === "number" && playlistCount > 0 && (
            <>
              <Text color="gray.400">•</Text>
              <Text fontSize="xs" color="gray.500">
                {playlistCount} playlist{playlistCount === 1 ? "" : "s"}
              </Text>
            </>
          )}
        </Flex>

        {/* Row 3: Technical Details (inline) */}
        {details.length > 0 && (
          <Flex gap={3} fontSize="xs" color="gray.600" flexWrap="wrap">
            {details.map((detail, idx) => (
              <Text key={idx}>
                {detail.icon} {detail.value}
              </Text>
            ))}
          </Flex>
        )}

        {/* Row 4: Genres/Styles + Links (combined) */}
        <Flex gap={2} alignItems="center" flexWrap="wrap">
          {allGenres.slice(0, 4).map((genre, idx) => (
            <Badge key={idx} size="xs" variant={idx < genres.length ? "surface" : "outline"}>
              {genre}
            </Badge>
          ))}
          {allGenres.length > 4 && (
            <Badge size="xs" variant="subtle">
              +{allGenres.length - 4}
            </Badge>
          )}

          {((typeof track.local_tags === "string" &&
            track.local_tags !== "{}" &&
            track.local_tags !== "") ||
            (Array.isArray(track.local_tags) &&
              track.local_tags.length > 0)) && (
            <Badge
              size="xs"
              variant="solid"
              colorPalette="blue"
            >
              {Array.isArray(track.local_tags)
                ? track.local_tags.join(", ")
                : track.local_tags}
            </Badge>
          )}

          {/* Service Links (inline with badges) */}
          <Flex gap={1.5} ml="auto">
            {track.discogs_url && (
              <Link href={track.discogs_url} target="_blank" aria-label="Discogs">
                <SiDiscogs size={16} style={{ opacity: 0.7 }} />
              </Link>
            )}
            {track.spotify_url && (
              <Link href={track.spotify_url} target="_blank" aria-label="Spotify">
                <SiSpotify size={16} style={{ opacity: 0.7 }} />
              </Link>
            )}
            {track.apple_music_url && (
              <Link href={track.apple_music_url} target="_blank" aria-label="Apple Music">
                <SiApplemusic size={16} style={{ opacity: 0.7 }} />
              </Link>
            )}
            {track.youtube_url && (
              <Link href={track.youtube_url} target="_blank" aria-label="YouTube">
                <SiYoutube size={16} style={{ opacity: 0.7 }} />
              </Link>
            )}
            {track.soundcloud_url && (
              <Link href={track.soundcloud_url} target="_blank" aria-label="SoundCloud">
                <SiSoundcloud size={16} style={{ opacity: 0.7 }} />
              </Link>
            )}
          </Flex>
        </Flex>

        {/* Row 5: Notes (if present) */}
        {track.notes && (
          <Box mt={1}>
            <ExpandableMarkdown text={track.notes} maxLength={80} />
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
