"use client";

import React from "react";
import NextLink from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge, Flex, Link, Popover, Text } from "@chakra-ui/react";
import type { Track } from "@/types/track";
import { queryKeys } from "@/lib/queryKeys";
import { fetchTrackPlaylists } from "@/services/internalApi/tracks";

type TrackPlaylistUsageProps = {
  track: Pick<Track, "track_id" | "friend_id">;
  count: number;
  size?: "xs" | "sm";
  variant?: "subtle" | "surface" | "solid" | "outline";
};

export default function TrackPlaylistUsage({
  track,
  count,
  size = "xs",
  variant = "subtle",
}: TrackPlaylistUsageProps) {
  const [open, setOpen] = React.useState(false);
  const playlistsQuery = useQuery({
    queryKey: queryKeys.trackPlaylists(track.track_id, track.friend_id),
    queryFn: () => fetchTrackPlaylists(track.track_id, track.friend_id),
    enabled: open && count > 0,
    staleTime: 30_000,
  });

  if (count <= 0) return null;

  return (
    <Popover.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
      <Popover.Trigger asChild>
        <Badge
          as="button"
          colorPalette="purple"
          size={size}
          variant={variant}
          cursor="pointer"
        >
          {count} playlist{count === 1 ? "" : "s"}
        </Badge>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content maxW="280px">
          <Popover.Body>
            {playlistsQuery.isLoading ? (
              <Text fontSize="sm" color="gray.500">
                Loading playlists...
              </Text>
            ) : playlistsQuery.error ? (
              <Text fontSize="sm" color="red.500">
                Failed to load playlists
              </Text>
            ) : playlistsQuery.data && playlistsQuery.data.length > 0 ? (
              <Flex direction="column" gap={1.5}>
                {playlistsQuery.data.map((playlist) => (
                  <Flex
                    key={`${playlist.id}:${playlist.position}`}
                    justify="space-between"
                    alignItems="center"
                    gap={3}
                  >
                    <Link
                      asChild
                      fontSize="sm"
                      fontWeight="medium"
                      lineClamp={1}
                    >
                      <NextLink href={`/playlists/${playlist.id}`}>
                        {playlist.name}
                      </NextLink>
                    </Link>
                    <Badge size="xs" colorPalette="blue" flexShrink={0}>
                      #{playlist.position}
                    </Badge>
                  </Flex>
                ))}
              </Flex>
            ) : (
              <Text fontSize="sm" color="gray.500">
                No playlist memberships found.
              </Text>
            )}
          </Popover.Body>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}
