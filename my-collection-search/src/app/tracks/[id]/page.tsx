"use client";

import NextLink from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Link,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import TrackResultStore from "@/components/TrackResultStore";
import TrackActionsMenu from "@/components/TrackActionsMenu";
import { useTrackByIdQuery } from "@/hooks/useTrackByIdQuery";

type TrackPlaylistMembership = {
  id: number;
  name: string;
  position: number;
};

async function fetchTrackPlaylists(
  trackId: string,
  friendId: number
): Promise<TrackPlaylistMembership[]> {
  const res = await fetch(
    `/api/tracks/${encodeURIComponent(trackId)}/playlists?friend_id=${friendId}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Failed to fetch track playlists");
  }
  return Array.isArray(data?.playlists)
    ? (data.playlists as TrackPlaylistMembership[])
    : [];
}

export default function TrackPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const trackId = params?.id ?? "";
  const friendIdRaw = searchParams?.get("friend_id") ?? "";
  const friendId = Number(friendIdRaw);
  const hasValidFriendId = Number.isFinite(friendId) && friendId > 0;

  const trackQuery = useTrackByIdQuery(trackId, friendId, hasValidFriendId);
  const playlistsQuery = useQuery({
    queryKey: ["track-playlists", trackId, friendId],
    queryFn: () => fetchTrackPlaylists(trackId, friendId),
    enabled: hasValidFriendId && !!trackId,
  });

  return (
    <Box maxW="1100px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <Flex justify="space-between" align="center" mb={4} gap={3} wrap="wrap">
        <Heading size="lg">Track Details</Heading>
        <Button asChild variant="outline" size="sm">
          <NextLink href="/">Back to Search</NextLink>
        </Button>
      </Flex>

      {!hasValidFriendId && (
        <Box borderWidth="1px" borderRadius="md" p={4}>
          <Text fontWeight="medium" mb={2}>
            Missing `friend_id`
          </Text>
          <Text color="fg.muted">
            Open this page with a `friend_id` query param, for example:
          </Text>
          <Text fontFamily="mono" mt={2}>
            /tracks/{trackId || "{track_id}"}?friend_id=1
          </Text>
        </Box>
      )}

      {hasValidFriendId && (
        <>
          {trackQuery.isLoading ? (
            <VStack align="stretch" gap={3}>
              <Skeleton height="28px" />
              <Skeleton height="120px" />
            </VStack>
          ) : trackQuery.error ? (
            <Box borderWidth="1px" borderRadius="md" p={4}>
              <Text color="red.500" fontWeight="medium">
                Failed to load track
              </Text>
              <Text mt={1}>{trackQuery.error.message}</Text>
            </Box>
          ) : trackQuery.data ? (
            <>
              <TrackResultStore
                trackId={trackId}
                friendId={friendId}
                fallbackTrack={trackQuery.data}
                allowMinimize={false}
                buttons={[<TrackActionsMenu key="menu" track={trackQuery.data} />]}
              />

              <Box borderWidth="1px" borderRadius="md" p={4} mt={4}>
                <Heading size="sm" mb={3}>
                  In Playlists
                </Heading>

                {playlistsQuery.isLoading ? (
                  <VStack align="stretch" gap={2}>
                    <Skeleton height="20px" />
                    <Skeleton height="20px" />
                  </VStack>
                ) : playlistsQuery.error ? (
                  <Text color="red.500">
                    {playlistsQuery.error instanceof Error
                      ? playlistsQuery.error.message
                      : "Failed to load playlist memberships"}
                  </Text>
                ) : playlistsQuery.data && playlistsQuery.data.length > 0 ? (
                  <VStack align="stretch" gap={2}>
                    {playlistsQuery.data.map((playlist) => (
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
            </>
          ) : (
            <Text>Track not found.</Text>
          )}
        </>
      )}
    </Box>
  );
}
