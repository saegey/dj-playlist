"use client";

import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Icon,
  RatingGroup,
  Badge,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { FiPlay } from "react-icons/fi";
import { Track } from "@/types/track";
import { keyToCamelot } from "@/lib/playlistOrder";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import ExpandableMarkdown from "./ExpandableMarkdown";

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

export type AlbumTrackItemProps = {
  track: Track;
  albumArtist: string;
  buttons?: React.ReactNode;
};

export default function AlbumTrackItem({
  track,
  albumArtist,
  buttons,
}: AlbumTrackItemProps) {
  const { replacePlaylist } = usePlaylistPlayer();
  const [notesModalOpen, setNotesModalOpen] = useState(false);

  // Only show artist if different from album artist (for compilations)
  const showArtist = track.artist !== albumArtist;

  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      p={{ base: 2, md: 3 }}
      mb={2}
      position="relative"
    >
      <Flex gap={{ base: 2, md: 3 }} alignItems="center">
        {/* Play button (if audio available) */}
        {track.local_audio_url && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() =>
              replacePlaylist([track], { autoplay: true, startIndex: 0 })
            }
            flexShrink={0}
          >
            <Icon as={FiPlay} />
          </Button>
        )}

        {/* Track info */}
        <Flex flex="1" direction="column" gap={1} minW={0}>
          {/* Position and Title */}
          <Flex gap={2} alignItems="baseline" flexWrap="wrap">
            {track.position && (
              <Text
                fontSize={{ base: "xs", md: "sm" }}
                color="gray.500"
                flexShrink={0}
              >
                {track.position}
              </Text>
            )}
            <Text
              fontWeight="bold"
              fontSize={{ base: "sm", md: "md" }}
              lineClamp={1}
            >
              {track.title}
            </Text>
          </Flex>

          {/* Artist (only if different from album artist) */}
          {showArtist && (
            <Text
              fontSize={{ base: "xs", md: "sm" }}
              color="gray.600"
              lineClamp={1}
            >
              {track.artist}
            </Text>
          )}

          {/* Metadata */}
          <Flex
            gap={2}
            fontSize={{ base: "xs", md: "sm" }}
            color="gray.600"
            flexWrap="wrap"
            alignItems="center"
          >
            {track.library_identifier && (
              <Badge colorPalette="blue" size="xs" fontWeight="bold">
                {track.library_identifier}
              </Badge>
            )}
            {track.duration_seconds && track.duration_seconds > 0 && (
              <Text>{formatSeconds(track.duration_seconds)}</Text>
            )}
            {track.bpm && <Text>{track.bpm} BPM</Text>}
            {track.key && (
              <Text>
                {track.key} ({keyToCamelot(track.key)})
              </Text>
            )}
            <RatingGroup.Root value={track.star_rating ?? 0} readOnly size="xs">
              {Array.from({ length: 5 }).map((_, index) => (
                <RatingGroup.Item key={index} index={index + 1}>
                  <RatingGroup.ItemIndicator />
                </RatingGroup.Item>
              ))}
            </RatingGroup.Root>
          </Flex>

          {/* Local tags */}
          {((typeof track.local_tags === "string" &&
            track.local_tags !== "{}" &&
            track.local_tags !== "") ||
            (Array.isArray(track.local_tags) && track.local_tags.length > 0)) && (
            <Flex gap={1} flexWrap="wrap">
              <Badge
                size="xs"
                variant="solid"
              >
                {Array.isArray(track.local_tags)
                  ? track.local_tags.join(", ")
                  : track.local_tags}
              </Badge>
            </Flex>
          )}

          {/* Notes - Desktop: inline, Mobile: hidden with button to open modal */}
          {track.notes && (
            <>
              {/* Desktop - show inline */}
              <Box display={{ base: "none", md: "block" }}>
                <ExpandableMarkdown text={track.notes} maxLength={100} />
              </Box>

              {/* Mobile - show button to open modal */}
              <Box display={{ base: "block", md: "none" }}>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setNotesModalOpen(true)}
                >
                  View Notes
                </Button>
              </Box>
            </>
          )}
        </Flex>

        {/* Action menu */}
        <Box flexShrink={0}>{buttons}</Box>
      </Flex>

      {/* Notes modal for mobile */}
      {track.notes && (
        <Dialog.Root
          open={notesModalOpen}
          onOpenChange={(e) => setNotesModalOpen(e.open)}
          size="md"
        >
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Notes - {track.title}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <ExpandableMarkdown text={track.notes} maxLength={1000} />
                </Dialog.Body>
                <Dialog.CloseTrigger />
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
    </Box>
  );
}
