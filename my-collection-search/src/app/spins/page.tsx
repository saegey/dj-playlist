"use client";

import React, { Suspense } from "react";
import NextLink from "next/link";
import {
  Badge,
  Box,
  Button,
  EmptyState,
  Flex,
  Grid,
  Heading,
  HStack,
  Link,
  NativeSelectField,
  NativeSelectRoot,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiActivity, FiClock, FiDisc, FiTrash2 } from "react-icons/fi";
import PageContainer from "@/components/layout/PageContainer";
import { toaster } from "@/components/ui/toaster";
import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import { useSpinMutations, useSpinsQuery, useSpinTopTracksQuery } from "@/hooks/useSpinsQuery";
import { useUsername } from "@/providers/UsernameProvider";

function formatPlayedAt(dateString: string): string {
  return new Date(dateString).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SpinsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { friend: currentUserFriend } = useUsername();
  const { friends } = useFriendsQuery({ showCurrentUser: true });

  const selectedFriendId = searchParams.get("friend_id")
    ? Number(searchParams.get("friend_id"))
    : null;

  React.useEffect(() => {
    if (!searchParams.get("friend_id") && currentUserFriend) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("friend_id", String(currentUserFriend.id));
      router.replace(`/spins?${params.toString()}`);
    }
  }, [currentUserFriend, router, searchParams]);

  const spinsQuery = useSpinsQuery(
    {
      friend_id: selectedFriendId ?? 0,
      limit: 50,
      offset: 0,
    },
    { enabled: typeof selectedFriendId === "number" && selectedFriendId > 0 }
  );
  const topTracksQuery = useSpinTopTracksQuery(
    {
      friend_id: selectedFriendId ?? 0,
      limit: 12,
      offset: 0,
    },
    { enabled: typeof selectedFriendId === "number" && selectedFriendId > 0 }
  );
  const { deleteSpin, deleteSpinPending } = useSpinMutations(selectedFriendId ?? undefined);

  const handleFriendChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete("friend_id");
    } else {
      params.set("friend_id", value);
    }
    router.push(`/spins?${params.toString()}`);
  };

  const handleDeleteSpin = async (spinId: number) => {
    try {
      await deleteSpin(spinId);
      toaster.create({
        title: "Spin deleted",
        type: "success",
      });
    } catch (error) {
      toaster.create({
        title: "Failed to delete spin",
        description: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      });
    }
  };

  if (!selectedFriendId) {
    return (
      <PageContainer size="standard">
        <Flex justify="center" py={10}>
          <Spinner />
        </Flex>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="standard">
      <Stack gap={6}>
        <Flex
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={3}
        >
          <VStack align="start" gap={1}>
            <Heading size="lg">Vinyl Spins</Heading>
            <Text color="fg.muted">
              Global history and most-played physical vinyl tracks.
            </Text>
          </VStack>
          <NativeSelectRoot width={{ base: "100%", md: "260px" }}>
            <NativeSelectField
              value={selectedFriendId}
              onChange={(event) => handleFriendChange(event.target.value)}
            >
              {friends.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.username}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
        </Flex>

        <Grid templateColumns={{ base: "1fr", xl: "1.2fr 0.8fr" }} gap={6}>
          <Box borderWidth="1px" borderRadius="md" p={4}>
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between">
                <HStack gap={2}>
                  <FiClock />
                  <Heading size="md">Recent Spins</Heading>
                </HStack>
                <Badge variant="outline">{spinsQuery.spins.length}</Badge>
              </HStack>

              {spinsQuery.isLoading ? (
                <Flex justify="center" py={8}>
                  <Spinner size="sm" />
                </Flex>
              ) : spinsQuery.spins.length === 0 ? (
                <EmptyState.Root size="sm">
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <FiDisc />
                    </EmptyState.Indicator>
                    <VStack textAlign="center">
                      <EmptyState.Title>No spins logged yet</EmptyState.Title>
                      <EmptyState.Description>
                        Log a vinyl spin from an album page to start building history.
                      </EmptyState.Description>
                    </VStack>
                  </EmptyState.Content>
                </EmptyState.Root>
              ) : (
                <Stack gap={3}>
                  {spinsQuery.spins.map((item) => (
                    <Flex
                      key={item.session.id}
                      justify="space-between"
                      align={{ base: "start", md: "center" }}
                      direction={{ base: "column", md: "row" }}
                      gap={3}
                      borderWidth="1px"
                      borderRadius="md"
                      p={3}
                    >
                      <VStack align="start" gap={1} minW={0}>
                        <HStack gap={2} wrap="wrap">
                          <Badge colorPalette={item.derived.is_full_album_spin ? "green" : "blue"}>
                            {item.derived.is_full_album_spin
                              ? "Full album"
                              : item.session.selection_mode === "sides"
                                ? `${item.derived.selected_side_count} side${item.derived.selected_side_count === 1 ? "" : "s"}`
                                : `${item.derived.track_count} track${item.derived.track_count === 1 ? "" : "s"}`}
                          </Badge>
                          {item.session.context_type && (
                            <Badge variant="outline">{item.session.context_type}</Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm" fontWeight="medium">
                          {formatPlayedAt(item.session.played_at)}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          {item.track_events[0] ? (
                            <Link
                              as={NextLink}
                              href={`/albums/${encodeURIComponent(item.session.release_id)}?friend_id=${item.session.friend_id}`}
                            >
                              {item.track_events[0].album_snapshot}
                            </Link>
                          ) : (
                            item.session.release_id
                          )}
                        </Text>
                        {item.session.note && (
                          <Text fontSize="sm" color="fg.muted">
                            {item.session.note}
                          </Text>
                        )}
                      </VStack>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        loading={deleteSpinPending}
                        onClick={() => handleDeleteSpin(item.session.id)}
                      >
                        <FiTrash2 /> Delete
                      </Button>
                    </Flex>
                  ))}
                </Stack>
              )}
            </VStack>
          </Box>

          <Box borderWidth="1px" borderRadius="md" p={4}>
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between">
                <HStack gap={2}>
                  <FiActivity />
                  <Heading size="md">Most Played Tracks</Heading>
                </HStack>
                <Badge variant="outline">{topTracksQuery.topTracks.length}</Badge>
              </HStack>

              {topTracksQuery.isLoading ? (
                <Flex justify="center" py={8}>
                  <Spinner size="sm" />
                </Flex>
              ) : topTracksQuery.topTracks.length === 0 ? (
                <EmptyState.Root size="sm">
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <FiDisc />
                    </EmptyState.Indicator>
                    <VStack textAlign="center">
                      <EmptyState.Title>No top tracks yet</EmptyState.Title>
                      <EmptyState.Description>
                        Track analytics will appear after you log vinyl spins.
                      </EmptyState.Description>
                    </VStack>
                  </EmptyState.Content>
                </EmptyState.Root>
              ) : (
                <Stack gap={3}>
                  {topTracksQuery.topTracks.map((track, index) => (
                    <Box key={`${track.track_id}:${track.friend_id}`} borderWidth="1px" borderRadius="md" p={3}>
                      <HStack justify="space-between" align="start" gap={3}>
                        <VStack align="start" gap={0} minW={0}>
                          <HStack gap={2}>
                            <Badge colorPalette="blue">#{index + 1}</Badge>
                            <Badge variant="outline">{track.play_count} plays</Badge>
                          </HStack>
                          <Link
                            as={NextLink}
                            href={`/tracks/${encodeURIComponent(track.track_id)}?friend_id=${track.friend_id}`}
                            fontWeight="semibold"
                            lineClamp={1}
                          >
                            {track.title_snapshot}
                          </Link>
                          <Text fontSize="sm" color="fg.muted" lineClamp={1}>
                            {track.artist_snapshot}
                          </Text>
                          <Link
                            as={NextLink}
                            href={`/albums/${encodeURIComponent(track.release_id)}?friend_id=${track.friend_id}`}
                            fontSize="xs"
                            color="fg.muted"
                            lineClamp={1}
                          >
                            {track.album_snapshot}
                          </Link>
                        </VStack>
                        <VStack align="end" gap={1} flexShrink={0}>
                          {track.position_snapshot && (
                            <Badge variant="subtle">{track.position_snapshot}</Badge>
                          )}
                          <Text fontSize="xs" color="fg.muted">
                            {formatPlayedAt(track.last_played_at)}
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </Stack>
              )}
            </VStack>
          </Box>
        </Grid>
      </Stack>
    </PageContainer>
  );
}

export default function SpinsPage() {
  return (
    <Suspense
      fallback={
        <PageContainer size="standard">
          <Flex justify="center" py={10}>
            <Spinner />
          </Flex>
        </PageContainer>
      }
    >
      <SpinsPageContent />
    </Suspense>
  );
}
