"use client";

import NextLink from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Box, Button, Flex, Heading, Skeleton, Text, VStack } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import TrackResultStore from "@/components/TrackResultStore";
import TrackActionsMenu from "@/components/TrackActionsMenu";
import PageContainer from "@/components/layout/PageContainer";
import { useTrackDetailQueries } from "@/hooks/useTrackDetailQueries";
import {
  AudioMetadataSection,
  EssentiaSection,
  EmbeddingPreviewSection,
  IdentityEmbeddingSection,
  AudioVibeEmbeddingSection,
  TrackPlaylistsSection,
} from "@/components/track-detail";

export default function TrackPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const trackId = params?.id ?? "";
  const friendIdRaw = searchParams?.get("friend_id") ?? "";
  const friendId = Number(friendIdRaw);
  const hasValidFriendId = Number.isFinite(friendId) && friendId > 0;

  const {
    trackQuery,
    playlistsQuery,
    audioMetadataQuery,
    essentiaQuery,
    embeddingPreviewQuery,
    identityEmbeddingPreviewQuery,
    audioVibeEmbeddingPreviewQuery,
    extractCoverMutation,
  } = useTrackDetailQueries(trackId, friendId, hasValidFriendId);

  return (
    <PageContainer size="standard">
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

              <AudioMetadataSection
                query={audioMetadataQuery}
                trackAudioCoverUrl={trackQuery.data.audio_file_album_art_url}
                isExtractingCover={extractCoverMutation.isPending}
                onExtractCover={async () => {
                  try {
                    const savedUrl = await extractCoverMutation.mutateAsync();
                    toaster.create({
                      title: "Embedded cover extracted",
                      description: savedUrl || "Saved to track",
                      type: "success",
                    });
                    await Promise.all([trackQuery.refetch(), audioMetadataQuery.refetch()]);
                  } catch (err) {
                    toaster.create({
                      title: "Cover extraction failed",
                      description: err instanceof Error ? err.message : String(err),
                      type: "error",
                    });
                  }
                }}
              />
              <EssentiaSection query={essentiaQuery} />
              <EmbeddingPreviewSection query={embeddingPreviewQuery} />
              <IdentityEmbeddingSection query={identityEmbeddingPreviewQuery} />
              <AudioVibeEmbeddingSection query={audioVibeEmbeddingPreviewQuery} />
              <TrackPlaylistsSection query={playlistsQuery} />
            </>
          ) : (
            <Text>Track not found.</Text>
          )}
        </>
      )}
    </PageContainer>
  );
}
