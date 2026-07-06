"use client";

import React from "react";
import { Box, HStack, VStack, Text, Spinner } from "@chakra-ui/react";
import PlaylistItemActionsMenu from "@/components/PlaylistItemActionsMenu";
import { formatDateWithRelative } from "@/lib/date";
import type { Playlist } from "@/types/track";

interface PlaylistListItemProps {
  playlist: Playlist;
  isLoading?: boolean;
  onClick: () => void;
  onPlay: () => void;
  onDelete: () => void;
}

export default function PlaylistListItem({
  playlist,
  isLoading,
  onClick,
  onPlay,
  onDelete,
}: PlaylistListItemProps) {
  return (
    <Box
      w="100%"
      textAlign="left"
      px={3}
      py={2}
      borderWidth="1px"
      borderRadius="md"
      _hover={{ bg: "bg.muted" }}
      _active={{ bg: "bg.subtle" }}
    >
      <HStack justify="space-between" align="center" gap={3}>
        <Box
          display="flex"
          alignItems="center"
          gap={3}
          minW={0}
          cursor="pointer"
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === "Enter") onClick();
          }}
        >
          <Box
            boxSize="10"
            rounded="md"
            bg="blue.500"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            flexShrink={0}
            fontWeight="bold"
            fontSize="sm"
          >
            {playlist.tracks.length}
          </Box>
          <VStack align="start" gap={0} minW={0}>
            <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
              {playlist.name}
            </Text>
            <HStack gap={2} color="fg.muted" fontSize="xs">
              <Text>{formatDateWithRelative(playlist.created_at)}</Text>
            </HStack>
          </VStack>
        </Box>

        <HStack gap={1} flexShrink={0}>
          {isLoading && <Spinner size="xs" />}
          <PlaylistItemActionsMenu
            playlistName={playlist.name}
            onPlay={onPlay}
            onDelete={onDelete}
          />
        </HStack>
      </HStack>
    </Box>
  );
}
