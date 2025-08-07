"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Link,
  Image,
  Button,
  RatingGroup,
  Float,
  Badge,
  SimpleGrid,
} from "@chakra-ui/react";
import { SiDiscogs, SiApplemusic, SiYoutube, SiSpotify } from "react-icons/si";
import ExpandableMarkdown from "./ExpandableMarkdown";
import { Track } from "@/types/track";
import { FiPlay } from "react-icons/fi";
import { keyToCamelot } from "@/lib/playlistOrder";

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
  const [playingUrl, setPlayingUrl] = useState("");
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Start playback when audio is ready and URL is set
  useEffect(() => {
    if (playingUrl && audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error("Autoplay failed:", err);
      });
    }
  }, [playingUrl]);

  // Prevent hydration mismatch: render a placeholder for minimized view until after mount
  if (minimized && !expanded && !hasMounted) {
    // Adjust minH to match your minimized card height for best results
    return <Box minH="56px" />;
  }
  // Minimized view (only render after mount to avoid hydration mismatch)
  if (minimized && !expanded && hasMounted) {
    return (
      <Box borderWidth="1px" borderRadius="md" p={2} mb={2} position="relative">
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
              {track.album} - {track.artist}
            </Text>
            <Flex fontSize="sm" color="gray.600" gap={2}>
              <Text>{formatSeconds(track.duration_seconds || 0)}</Text>
              <Text>{track.position}</Text>
              {track.bpm && <Text>{track.bpm} bpm</Text>}
              <Text>
                {track.key} - {keyToCamelot(track.key)}
              </Text>
              {track.username && (
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
      borderWidth="1px"
      borderRadius="md"
      p={3}
      mb={2}
      flexDirection="column"
      flexGrow={1}
      minHeight={0}
      width={"100%"}
    >
      <Flex gap={3} position={"relative"} width={"100%"}>
        <Image
          src={track.album_thumbnail}
          alt={track.title}
          boxSize={["50px", "60px", "70px"]}
          objectFit="cover"
          borderRadius="md"
        />

        <Flex direction="column" flex={1}>
          <Text fontSize={["sm", "md", "md"]} fontWeight="bold">
            {track.title}{" "}
            {score && (
              <Badge
                colorPalette={
                  score > 90 ? "green" : score > 75 ? "yellow" : "red"
                }
                size={["xs", "sm", "sm"]}
              >
                {score.toFixed(2)}%
              </Badge>
            )}
          </Text>
          <Text fontSize={["sm", "md", "md"]}>{track.artist}</Text>
          <Text fontSize={["xs", "sm", "sm"]} color="brand.muted">
            {track.album} ({track.year})
          </Text>
        </Flex>

        {/* Action menu */}
        <Float mr={3} mt={3}>
          {buttons}
        </Float>
      </Flex>
      <Flex direction="column" flex={1}>
        <Flex alignItems="center" gap={2} mt={1}>
          <RatingGroup.Root defaultValue={track.star_rating || 0} readOnly>
            {Array.from({ length: 5 }).map((_, index) => (
              <RatingGroup.Item key={index} index={index + 1}>
                <RatingGroup.ItemIndicator fontSize="sm" />
              </RatingGroup.Item>
            ))}
          </RatingGroup.Root>
          {typeof playlistCount === "number" && playlistCount > 0 && (
            <Text fontSize={["xs", "sm", "sm"]} color="brand.muted" mt={1}>
              In {playlistCount} playlist{playlistCount === 1 ? "" : "s"}
            </Text>
          )}
        </Flex>
        <Flex gap={2} mt={1} flexWrap="wrap" mb={2} overflowX="auto">
          {/* Styles, genres, tags */}

          {Array.isArray(track.genres) && track.genres.length > 0 && (
            <>
              {track.genres.map((genre) => (
                <Badge key={genre} size={["xs", "sm", "sm"]} variant="surface">
                  {genre}
                </Badge>
              ))}
            </>
          )}
          {Array.isArray(track.styles) && track.styles.length > 0 && (
            <>
              {track.styles.map((style) => (
                <Badge key={style} size={["xs", "sm", "sm"]} variant="outline">
                  {style}
                </Badge>
              ))}
            </>
          )}
          {track.local_tags && track.local_tags !== "{}" && (
            <Badge
              key={track.local_tags}
              size={["xs", "sm", "sm"]}
              variant="solid"
            >
              {track.local_tags}
            </Badge>
          )}
        </Flex>

        {/* Details line */}
        <Box bg={"gray.subtle"} pl={4} pb={2} borderRadius="md">
          <SimpleGrid columns={[3, null, 3]} gap={1} mt={2}>
            {[
              { label: "Pos", value: track.position },
              {
                label: "Dur",
                value: formatSeconds(track.duration_seconds || 0),
              },
              { label: "BPM", value: track.bpm },
              {
                label: "Key",
                value: `${track.key} - ${keyToCamelot(track.key)}`,
              },
              { label: "Dance", value: track.danceability },
              { label: "Happy", value: track.mood_happy },
              { label: "Agg", value: track.mood_aggressive },
            ]
              .filter(
                (field) =>
                  field.value !== undefined &&
                  field.value !== null &&
                  field.value !== ""
              )
              .map((field) => (
                <Text fontSize={["xs", "sm", "sm"]} key={field.label}>
                  <strong>{field.label}:</strong> {field.value}
                </Text>
              ))}
          </SimpleGrid>
        </Box>

        {track.notes && (
          <Box mt={2}>
            <ExpandableMarkdown text={track.notes} maxLength={100} />
          </Box>
        )}

        {/* Links and audio */}
        <Flex gap={2} mt={2}>
          {track.discogs_url && (
            <Link href={track.discogs_url} target="_blank" aria-label="Discogs">
              <SiDiscogs size={20} style={{ verticalAlign: "middle" }} />
            </Link>
          )}
          {track.spotify_url && (
            <Link href={track.spotify_url} target="_blank">
              <SiSpotify size={20} style={{ verticalAlign: "middle" }} />
            </Link>
          )}
          {track.apple_music_url && (
            <Link href={track.apple_music_url} target="_blank">
              <SiApplemusic size={20} style={{ verticalAlign: "middle" }} />
            </Link>
          )}
          {track.youtube_url && (
            <Link href={track.youtube_url} target="_blank">
              <SiYoutube size={20} style={{ verticalAlign: "middle" }} />
            </Link>
          )}
          {track.username && (
            <Text fontSize="sm" color="gray.500">
              User: {track.username}
            </Text>
          )}
        </Flex>

        {track.local_audio_url && (
          <Box mt={2} width="100%" flexDir="column">
            {playingUrl === `/api/audio?filename=${track.local_audio_url}` ? (
              <audio
                ref={audioRef}
                controls
                style={{ width: "100%" }}
                preload="none"
                src={playingUrl}
              >
                Your browser does not support the audio element.
              </audio>
            ) : (
              <Button
                onClick={() =>
                  setPlayingUrl(`/api/audio?filename=${track.local_audio_url}`)
                }
                size={["xs", "sm"]}
                mt={1}
              >
                <FiPlay /> Play
              </Button>
            )}
          </Box>
        )}
        {/* Minimize button */}
        <Flex mt={2}>
          {allowMinimize && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => setExpanded(false)}
            >
              Hide
            </Button>
          )}
        </Flex>
      </Flex>

      {footer && <Box mt={2}>{footer}</Box>}
    </Flex>
  );
}
