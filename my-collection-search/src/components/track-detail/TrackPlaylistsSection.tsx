"use client";

import NextLink from "next/link";
import { Badge, Box, Heading, HStack, Link, Skeleton, Text, VStack } from "@chakra-ui/react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { TrackPlaylistMembership } from "@/services/internalApi/tracks";

type Props = {
  query: UseQueryResult<TrackPlaylistMembership[], Error>;
};

export default function TrackPlaylistsSection({ query }: Props) {
  return (
    <Box borderWidth="1px" borderRadius="md" p={4} mt={4}>
      <Heading size="sm" mb={3}>
        In Playlists
      </Heading>

      {query.isLoading ? (
        <VStack align="stretch" gap={2}>
          <Skeleton height="20px" />
          <Skeleton height="20px" />
        </VStack>
      ) : query.error ? (
        <Text color="red.500">
          {query.error instanceof Error
            ? query.error.message
            : "Failed to load playlist memberships"}
        </Text>
      ) : query.data && query.data.length > 0 ? (
        <VStack align="stretch" gap={2}>
          {query.data.map((playlist) => (
            <HStack key={`${playlist.id}:${playlist.position}`} justify="space-between">
              <Link as={NextLink} href={`/playlists/${playlist.id}`} fontWeight="medium">
                {playlist.name}
              </Link>
              <Badge colorPalette="blue">Position {playlist.position}</Badge>
            </HStack>
          ))}
        </VStack>
      ) : (
        <Text color="fg.muted">This track is not in any playlists yet.</Text>
      )}
    </Box>
  );
}
