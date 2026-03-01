"use client";

import NextLink from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  Link,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import TrackResultStore from "@/components/TrackResultStore";
import TrackActionsMenu from "@/components/TrackActionsMenu";
import { useTrackByIdQuery } from "@/hooks/useTrackByIdQuery";
import PageContainer from "@/components/layout/PageContainer";

type TrackPlaylistMembership = {
  id: number;
  name: string;
  position: number;
};

type TrackAudioMetadataResponse = {
  track_id: string;
  friend_id: number;
  local_audio_url: string;
  audio_file_album_art_url?: string | null;
  has_embedded_cover: boolean;
  embedded_cover?: {
    index: number;
    codec_name?: string;
    width?: number;
    height?: number;
    pix_fmt?: string;
  } | null;
  probe: unknown;
};

type TrackEssentiaResponse = {
  track_id: string;
  friend_id: number;
  file_path: string;
  data: unknown;
};

type TrackEmbeddingPreviewResponse = {
  track_id: string;
  friend_id: number;
  isDefaultTemplate: boolean;
  template: string;
  prompt: string;
};

type IdentityEmbeddingPreviewResponse = {
  identityText: string;
  identityData: {
    title: string;
    artist: string;
    album: string;
    era: string;
    country: string;
    labels: string[];
    genres: string[];
    styles: string[];
    tags: string[];
  };
};

type AudioVibeEmbeddingPreviewResponse = {
  vibeText: string;
  vibeData: {
    bpm: string;
    bpmRange: string;
    key: string;
    camelot: string;
    danceability: string;
    energy: string;
    dominantMood: string;
    moodProfile: string;
    vibeDescriptors: string[];
    acoustic?: string;
    vocalPresence?: string;
    percussiveness?: string;
    partyMood?: string;
  };
};

type EmbeddingPreviewResponse = {
  type: "identity" | "audio_vibe";
  text: string;
  data: unknown;
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

async function fetchTrackAudioMetadata(
  trackId: string,
  friendId: number
): Promise<TrackAudioMetadataResponse> {
  const res = await fetch(
    `/api/tracks/${encodeURIComponent(trackId)}/audio-metadata?friend_id=${friendId}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Failed to fetch audio metadata");
  }
  return data as TrackAudioMetadataResponse;
}

async function extractEmbeddedCover(trackId: string, friendId: number): Promise<string> {
  const res = await fetch(`/api/tracks/${encodeURIComponent(trackId)}/audio-metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ friend_id: friendId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Failed to extract embedded cover");
  }
  return String(data?.audio_file_album_art_url || "");
}

async function fetchTrackEssentiaData(
  trackId: string,
  friendId: number
): Promise<TrackEssentiaResponse> {
  const res = await fetch(
    `/api/tracks/${encodeURIComponent(trackId)}/essentia?friend_id=${friendId}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Failed to fetch Essentia analysis data");
  }
  return data as TrackEssentiaResponse;
}

async function fetchTrackEmbeddingPreview(
  trackId: string,
  friendId: number
): Promise<TrackEmbeddingPreviewResponse> {
  const res = await fetch(
    `/api/tracks/${encodeURIComponent(trackId)}/embedding-preview?friend_id=${friendId}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Failed to fetch embedding preview");
  }
  return data as TrackEmbeddingPreviewResponse;
}

async function fetchIdentityEmbeddingPreview(
  trackId: string,
  friendId: number
): Promise<IdentityEmbeddingPreviewResponse> {
  const res = await fetch(
    `/api/embeddings/preview?track_id=${encodeURIComponent(trackId)}&friend_id=${friendId}&type=identity`,
    { cache: "no-store" }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Failed to fetch identity embedding preview");
  }
  const preview = data as EmbeddingPreviewResponse;
  return {
    identityText: preview.text,
    identityData: preview.data as IdentityEmbeddingPreviewResponse["identityData"],
  };
}

async function fetchAudioVibeEmbeddingPreview(
  trackId: string,
  friendId: number
): Promise<AudioVibeEmbeddingPreviewResponse> {
  const res = await fetch(
    `/api/embeddings/preview?track_id=${encodeURIComponent(trackId)}&friend_id=${friendId}&type=audio_vibe`,
    { cache: "no-store" }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Failed to fetch audio vibe embedding preview");
  }
  const preview = data as EmbeddingPreviewResponse;
  return {
    vibeText: preview.text,
    vibeData: preview.data as AudioVibeEmbeddingPreviewResponse["vibeData"],
  };
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
  const audioMetadataQuery = useQuery({
    queryKey: ["track-audio-metadata", trackId, friendId],
    queryFn: () => fetchTrackAudioMetadata(trackId, friendId),
    enabled: hasValidFriendId && !!trackId,
  });
  const essentiaQuery = useQuery({
    queryKey: ["track-essentia", trackId, friendId],
    queryFn: () => fetchTrackEssentiaData(trackId, friendId),
    enabled: hasValidFriendId && !!trackId,
  });
  const embeddingPreviewQuery = useQuery({
    queryKey: ["track-embedding-preview", trackId, friendId],
    queryFn: () => fetchTrackEmbeddingPreview(trackId, friendId),
    enabled: hasValidFriendId && !!trackId,
  });
  const identityEmbeddingPreviewQuery = useQuery({
    queryKey: ["track-identity-embedding-preview", trackId, friendId],
    queryFn: () => fetchIdentityEmbeddingPreview(trackId, friendId),
    enabled: hasValidFriendId && !!trackId,
  });
  const audioVibeEmbeddingPreviewQuery = useQuery({
    queryKey: ["track-audio-vibe-embedding-preview", trackId, friendId],
    queryFn: () => fetchAudioVibeEmbeddingPreview(trackId, friendId),
    enabled: hasValidFriendId && !!trackId,
  });
  const extractCoverMutation = useMutation({
    mutationFn: () => extractEmbeddedCover(trackId, friendId),
  });

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

              <Box borderWidth="1px" borderRadius="md" p={4} mt={4}>
                <Flex justify="space-between" align="center" mb={3} gap={3} wrap="wrap">
                  <Heading size="sm">Audio File Metadata (ffprobe)</Heading>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={extractCoverMutation.isPending}
                    onClick={async () => {
                      try {
                        const savedUrl = await extractCoverMutation.mutateAsync();
                        toaster.create({
                          title: "Embedded cover extracted",
                          description: savedUrl || "Saved to track",
                          type: "success",
                        });
                        await Promise.all([
                          trackQuery.refetch(),
                          audioMetadataQuery.refetch(),
                        ]);
                      } catch (err) {
                        toaster.create({
                          title: "Cover extraction failed",
                          description: err instanceof Error ? err.message : String(err),
                          type: "error",
                        });
                      }
                    }}
                  >
                    Extract Embedded Cover
                  </Button>
                </Flex>

                {audioMetadataQuery.isLoading ? (
                  <VStack align="stretch" gap={2}>
                    <Skeleton height="20px" />
                    <Skeleton height="120px" />
                  </VStack>
                ) : audioMetadataQuery.error ? (
                  <Text color="red.500">
                    {audioMetadataQuery.error instanceof Error
                      ? audioMetadataQuery.error.message
                      : "Failed to load audio metadata"}
                  </Text>
                ) : audioMetadataQuery.data ? (
                  <VStack align="stretch" gap={3}>
                    <HStack gap={2} flexWrap="wrap">
                      <Badge colorPalette={audioMetadataQuery.data.has_embedded_cover ? "green" : "gray"}>
                        {audioMetadataQuery.data.has_embedded_cover
                          ? "Embedded Cover Found"
                          : "No Embedded Cover"}
                      </Badge>
                      <Badge variant="outline">{audioMetadataQuery.data.local_audio_url}</Badge>
                    </HStack>

                    {(trackQuery.data.audio_file_album_art_url ||
                      audioMetadataQuery.data.audio_file_album_art_url) && (
                      <Box>
                        <Text fontSize="sm" mb={2}>
                          Saved Audio Cover
                        </Text>
                        <Image
                          src={
                            trackQuery.data.audio_file_album_art_url ||
                            audioMetadataQuery.data.audio_file_album_art_url ||
                            ""
                          }
                          alt="Audio embedded cover"
                          boxSize="120px"
                          objectFit="cover"
                          borderRadius="md"
                          borderWidth="1px"
                        />
                      </Box>
                    )}

                    <Box
                      as="pre"
                      p={3}
                      borderRadius="md"
                      borderWidth="1px"
                      overflow="auto"
                      maxH="420px"
                      fontSize="xs"
                      whiteSpace="pre-wrap"
                    >
                      {JSON.stringify(audioMetadataQuery.data.probe, null, 2)}
                    </Box>
                  </VStack>
                ) : (
                  <Text color="fg.muted">No audio metadata available.</Text>
                )}
              </Box>

              <Box borderWidth="1px" borderRadius="md" p={4} mt={4}>
                <Heading size="sm" mb={3}>
                  Essentia Raw Analysis
                </Heading>

                {essentiaQuery.isLoading ? (
                  <VStack align="stretch" gap={2}>
                    <Skeleton height="20px" />
                    <Skeleton height="120px" />
                  </VStack>
                ) : essentiaQuery.error ? (
                  <Text color="fg.muted">
                    {essentiaQuery.error instanceof Error
                      ? essentiaQuery.error.message
                      : "No Essentia file available yet"}
                  </Text>
                ) : essentiaQuery.data ? (
                  <VStack align="stretch" gap={3}>
                    <Badge variant="outline">{essentiaQuery.data.file_path}</Badge>
                    <Box
                      as="pre"
                      p={3}
                      borderRadius="md"
                      borderWidth="1px"
                      overflow="auto"
                      maxH="420px"
                      fontSize="xs"
                      whiteSpace="pre-wrap"
                    >
                      {JSON.stringify(essentiaQuery.data.data, null, 2)}
                    </Box>
                  </VStack>
                ) : (
                  <Text color="fg.muted">No Essentia file available yet.</Text>
                )}
              </Box>

              <Box borderWidth="1px" borderRadius="md" p={4} mt={4}>
                <Heading size="sm" mb={3}>
                  Embedding Preview (Original)
                </Heading>

                {embeddingPreviewQuery.isLoading ? (
                  <VStack align="stretch" gap={2}>
                    <Skeleton height="20px" />
                    <Skeleton height="120px" />
                  </VStack>
                ) : embeddingPreviewQuery.error ? (
                  <Text color="red.500">
                    {embeddingPreviewQuery.error instanceof Error
                      ? embeddingPreviewQuery.error.message
                      : "Failed to load embedding preview"}
                  </Text>
                ) : embeddingPreviewQuery.data ? (
                  <VStack align="stretch" gap={3}>
                    <HStack gap={2} flexWrap="wrap">
                      <Badge
                        colorPalette={
                          embeddingPreviewQuery.data.isDefaultTemplate ? "gray" : "green"
                        }
                      >
                        {embeddingPreviewQuery.data.isDefaultTemplate
                          ? "Default Template"
                          : "Custom Template"}
                      </Badge>
                    </HStack>
                    <Box
                      as="pre"
                      p={3}
                      borderRadius="md"
                      borderWidth="1px"
                      overflow="auto"
                      maxH="420px"
                      fontSize="xs"
                      whiteSpace="pre-wrap"
                    >
                      {embeddingPreviewQuery.data.prompt}
                    </Box>
                  </VStack>
                ) : (
                  <Text color="fg.muted">No embedding preview available.</Text>
                )}
              </Box>

              <Box borderWidth="1px" borderRadius="md" p={4} mt={4}>
                <Heading size="sm" mb={3}>
                  Identity Embedding Preview
                </Heading>

                {identityEmbeddingPreviewQuery.isLoading ? (
                  <VStack align="stretch" gap={2}>
                    <Skeleton height="20px" />
                    <Skeleton height="120px" />
                  </VStack>
                ) : identityEmbeddingPreviewQuery.error ? (
                  <Text color="red.500">
                    {identityEmbeddingPreviewQuery.error instanceof Error
                      ? identityEmbeddingPreviewQuery.error.message
                      : "Failed to load identity embedding preview"}
                  </Text>
                ) : identityEmbeddingPreviewQuery.data ? (
                  <VStack align="stretch" gap={3}>
                    <HStack gap={2} flexWrap="wrap">
                      <Badge colorPalette="purple">Music Identity</Badge>
                      <Badge variant="outline">
                        {identityEmbeddingPreviewQuery.data.identityData.era}
                      </Badge>
                      <Badge variant="outline">
                        {identityEmbeddingPreviewQuery.data.identityData.country}
                      </Badge>
                    </HStack>
                    <Box
                      as="pre"
                      p={3}
                      borderRadius="md"
                      borderWidth="1px"
                      overflow="auto"
                      maxH="420px"
                      fontSize="xs"
                      whiteSpace="pre-wrap"
                      bg="gray.50"
                      _dark={{ bg: "gray.900" }}
                    >
                      {identityEmbeddingPreviewQuery.data.identityText}
                    </Box>
                    <Box fontSize="xs" color="fg.muted">
                      <Text fontWeight="medium" mb={1}>Normalized Data:</Text>
                      <Text>Genres: {identityEmbeddingPreviewQuery.data.identityData.genres.join(", ") || "none"}</Text>
                      <Text>Styles: {identityEmbeddingPreviewQuery.data.identityData.styles.join(", ") || "none"}</Text>
                      <Text>Tags: {identityEmbeddingPreviewQuery.data.identityData.tags.join(", ") || "none"}</Text>
                      <Text>Labels: {identityEmbeddingPreviewQuery.data.identityData.labels.join(", ") || "none"}</Text>
                    </Box>
                  </VStack>
                ) : (
                  <Text color="fg.muted">No identity embedding preview available.</Text>
                )}
              </Box>

              <Box borderWidth="1px" borderRadius="md" p={4} mt={4}>
                <Heading size="sm" mb={3}>
                  Audio Vibe Embedding Preview
                </Heading>

                {audioVibeEmbeddingPreviewQuery.isLoading ? (
                  <VStack align="stretch" gap={2}>
                    <Skeleton height="20px" />
                    <Skeleton height="120px" />
                  </VStack>
                ) : audioVibeEmbeddingPreviewQuery.error ? (
                  <Text color="red.500">
                    {audioVibeEmbeddingPreviewQuery.error instanceof Error
                      ? audioVibeEmbeddingPreviewQuery.error.message
                      : "Failed to load audio vibe embedding preview"}
                  </Text>
                ) : audioVibeEmbeddingPreviewQuery.data ? (
                  <VStack align="stretch" gap={3}>
                    <HStack gap={2} flexWrap="wrap">
                      <Badge colorPalette="cyan">Audio Vibe</Badge>
                      {audioVibeEmbeddingPreviewQuery.data.vibeData.bpm !== "unknown" && (
                        <Badge variant="outline">
                          {audioVibeEmbeddingPreviewQuery.data.vibeData.bpm} BPM
                        </Badge>
                      )}
                      {audioVibeEmbeddingPreviewQuery.data.vibeData.key !== "unknown" && (
                        <Badge variant="outline">
                          {audioVibeEmbeddingPreviewQuery.data.vibeData.key}
                        </Badge>
                      )}
                      {audioVibeEmbeddingPreviewQuery.data.vibeData.energy && (
                        <Badge variant="outline" colorPalette="orange">
                          {audioVibeEmbeddingPreviewQuery.data.vibeData.energy} energy
                        </Badge>
                      )}
                    </HStack>
                    <Box
                      as="pre"
                      p={3}
                      borderRadius="md"
                      borderWidth="1px"
                      overflow="auto"
                      maxH="420px"
                      fontSize="xs"
                      whiteSpace="pre-wrap"
                      bg="gray.50"
                      _dark={{ bg: "gray.900" }}
                    >
                      {audioVibeEmbeddingPreviewQuery.data.vibeText}
                    </Box>
                    <Box fontSize="xs" color="fg.muted">
                      <Text fontWeight="medium" mb={1}>Vibe Profile:</Text>
                      <Text>Descriptors: {audioVibeEmbeddingPreviewQuery.data.vibeData.vibeDescriptors.join(", ")}</Text>
                      <Text>Dominant Mood: {audioVibeEmbeddingPreviewQuery.data.vibeData.dominantMood}</Text>
                      <Text>Danceability: {audioVibeEmbeddingPreviewQuery.data.vibeData.danceability}</Text>
                      {audioVibeEmbeddingPreviewQuery.data.vibeData.acoustic && (
                        <Text>Acoustic: {audioVibeEmbeddingPreviewQuery.data.vibeData.acoustic}</Text>
                      )}
                      {audioVibeEmbeddingPreviewQuery.data.vibeData.vocalPresence && (
                        <Text>Vocals: {audioVibeEmbeddingPreviewQuery.data.vibeData.vocalPresence}</Text>
                      )}
                      {audioVibeEmbeddingPreviewQuery.data.vibeData.percussiveness && (
                        <Text>Percussiveness: {audioVibeEmbeddingPreviewQuery.data.vibeData.percussiveness}</Text>
                      )}
                    </Box>
                  </VStack>
                ) : (
                  <Text color="fg.muted">No audio vibe embedding preview available. This track may not have audio analysis data.</Text>
                )}
              </Box>

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
    </PageContainer>
  );
}
