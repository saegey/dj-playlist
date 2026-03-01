"use client";

import React, { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import {
  Box,
  Flex,
  Spinner,
  Text,
  Image,
  Badge,
  Link,
  Button,
  Icon,
  Heading,
  RatingGroup,
  Textarea,
  Input,
  Menu,
} from "@chakra-ui/react";
import { SiDiscogs } from "react-icons/si";
import { FiPlay, FiDownload, FiEdit, FiMoreVertical } from "react-icons/fi";
import NextLink from "next/link";

import { useAlbumDetailQuery, useUpdateAlbumMutation } from "@/hooks/useAlbumsQuery";
import { useAlbum, useAlbumHydrated } from "@/hooks/useAlbum";
import { useTracksByRelease, useTracksByReleaseHydrated } from "@/hooks/useTrack";
import AlbumTrackItem from "@/components/AlbumTrackItem";
import TrackActionsMenu from "@/components/TrackActionsMenu";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { toaster } from "@/components/ui/toaster";
import { useColorModeValue } from "@/components/ui/color-mode";
import PageContainer from "@/components/layout/PageContainer";

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

type DiscogsRawResponse = {
  friend_id: number;
  release_id: string;
  username: string;
  file_path: string;
  data: unknown;
};

async function fetchDiscogsRawRelease(
  releaseId: string,
  friendId: number
): Promise<DiscogsRawResponse> {
  const res = await fetch(
    `/api/albums/${encodeURIComponent(releaseId)}/discogs-raw?friend_id=${friendId}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Failed to load Discogs raw file");
  }
  return data as DiscogsRawResponse;
}

function AlbumDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const releaseId = params.releaseId as string;
  const friendId = parseInt(searchParams.get("friend_id") || "0");

  const { error } = useAlbumDetailQuery(releaseId, friendId);
  const albumFromStore = useAlbum(releaseId, friendId);
  const albumHydrated = useAlbumHydrated(releaseId, friendId);
  const tracksHydrated = useTracksByReleaseHydrated(releaseId, friendId);
  const tracksFromStore = useTracksByRelease(releaseId, friendId);
  const discogsRawQuery = useQuery({
    queryKey: ["album-discogs-raw", releaseId, friendId],
    queryFn: () => fetchDiscogsRawRelease(releaseId, friendId),
    enabled: !!releaseId && !!friendId,
  });
  const updateMutation = useUpdateAlbumMutation();
  const { replacePlaylist } = usePlaylistPlayer();

  const [isEditing, setIsEditing] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [purchasePrice, setPurchasePrice] = React.useState("");
  const [condition, setCondition] = React.useState("");
  const [libraryIdentifier, setLibraryIdentifier] = React.useState("");
  const [isDownloading, setIsDownloading] = React.useState(false);

  const panelBg = useColorModeValue("gray.50", "gray.800");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const subtleText = useColorModeValue("gray.500", "gray.500");
  const album = albumFromStore;
  const tracks = tracksFromStore;

  React.useEffect(() => {
    if (album) {
      setRating(album.album_rating || 0);
      setNotes(album.album_notes || "");
      setPurchasePrice(album.purchase_price?.toString() || "");
      setCondition(album.condition || "");
      setLibraryIdentifier(album.library_identifier || "");
    }
  }, [album]);

  const handleSave = async () => {
    if (!album) return;

    await updateMutation.mutateAsync({
      release_id: album.release_id,
      friend_id: album.friend_id,
      album_rating: rating,
      album_notes: notes,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
      condition: condition || undefined,
      library_identifier: libraryIdentifier || null,
    });
    setIsEditing(false);
  };

  const handleEnqueueAlbum = () => {
    if (tracks.length === 0 || !album) {
      toaster.create({
        title: "No Tracks",
        description: "This album has no tracks to play",
        type: "warning",
      });
      return;
    }

    replacePlaylist(tracks, {
      autoplay: true,
      startIndex: 0,
    });

    toaster.create({
      title: "Album Enqueued",
      description: `Playing ${album.title} by ${album.artist}`,
      type: "success",
    });
  };

  const handleDownloadAlbum = async () => {
    if (!album) return;

    setIsDownloading(true);
    try {
      const response = await fetch(
        `/api/albums/${releaseId}/download?friend_id=${friendId}`,
        { method: "POST" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to enqueue downloads");
      }

      if (result.tracksQueued === 0) {
        toaster.create({
          title: "No Downloads Needed",
          description: "All tracks already have audio files or no URLs available",
          type: "info",
        });
      } else {
        toaster.create({
          title: "Downloads Queued",
          description: `${result.tracksQueued} track${result.tracksQueued === 1 ? "" : "s"} queued for download`,
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error downloading album:", error);
      toaster.create({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!friendId) {
    return (
      <PageContainer size="standard" py={8}>
        <Text color="red.500">Error: friend_id parameter is required</Text>
      </PageContainer>
    );
  }

  if ((!albumHydrated || !tracksHydrated) && !error) {
    return (
      <PageContainer size="standard" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" />
        </Flex>
      </PageContainer>
    );
  }

  if (error || !album) {
    return (
      <PageContainer size="standard" py={8}>
        <Text color="red.500">
          Error loading album: {error instanceof Error ? error.message : "Unknown error"}
        </Text>
      </PageContainer>
    );
  }

  const albumArtwork =
    tracks.find((t) => t.audio_file_album_art_url)?.audio_file_album_art_url ||
    album.album_thumbnail;

  return (
    <PageContainer size="standard" mb="100px">

      {/* Album header */}
      <Flex gap={{ base: 3, md: 6 }} direction={{ base: "column", md: "row" }} mb={{ base: 4, md: 8 }}>
        {/* Album artwork */}
        {albumArtwork && (
          <Box flexShrink={0}>
            <Image
              src={albumArtwork}
              alt={album.title}
              boxSize={{ base: "140px", md: "300px" }}
              objectFit="cover"
              borderRadius="lg"
            />
          </Box>
        )}

        {/* Album info */}
        <Flex flex="1" direction="column" gap={{ base: 2, md: 3 }}>
          <Box>
            <Flex alignItems="center" gap={{ base: 2, md: 3 }} mb={2} flexWrap="wrap">
              {album.library_identifier && (
                <Badge colorPalette="blue" size={{ base: "md", md: "lg" }} variant="solid" fontWeight="bold">
                  {album.library_identifier}
                </Badge>
              )}
              <Heading size={{ base: "lg", md: "2xl" }}>
                {album.title}
              </Heading>
            </Flex>
            <Link
              as={NextLink}
              href={`/albums?q=${encodeURIComponent(album.artist)}`}
              _hover={{ textDecoration: "underline" }}
            >
              <Heading size={{ base: "md", md: "lg" }} color={mutedText} fontWeight="normal">
                {album.artist}
              </Heading>
            </Link>
          </Box>

          {/* Rating */}
          <Flex alignItems="center" gap={2}>
            <RatingGroup.Root
              value={rating}
              onValueChange={(details) => {
                setRating(details.value);
                if (!isEditing) {
                  // Auto-save rating on change
                  updateMutation.mutate({
                    release_id: album.release_id,
                    friend_id: album.friend_id,
                    album_rating: details.value,
                  });
                }
              }}
              count={5}
              size={{ base: "sm", md: "lg" }}
            >
              {[1, 2, 3, 4, 5].map((index) => (
                <RatingGroup.Item key={index} index={index}>
                  <RatingGroup.ItemIndicator />
                </RatingGroup.Item>
              ))}
            </RatingGroup.Root>
            <Text fontSize={{ base: "sm", md: "md" }} color={subtleText}>
              ({rating}/5)
            </Text>
          </Flex>

          {/* Metadata */}
          <Flex gap={{ base: 2, md: 4 }} flexWrap="wrap" fontSize={{ base: "xs", md: "md" }} color={mutedText}>
            {album.year && <Text fontWeight="semibold">{album.year}</Text>}
            {album.format && <Text>{album.format}</Text>}
            {album.label && <Text>{album.label}</Text>}
            {album.catalog_number && <Text>Cat: {album.catalog_number}</Text>}
            {album.country && <Text>{album.country}</Text>}
          </Flex>

          {/* Genres and Styles */}
          {(album.genres || album.styles) && (
            <Flex gap={1} flexWrap="wrap">
              {album.genres?.map((genre) => (
                <Badge key={genre} colorScheme="blue" size={{ base: "sm", md: "md" }}>
                  {genre}
                </Badge>
              ))}
              {album.styles?.map((style) => (
                <Badge key={style} colorScheme="purple" size={{ base: "sm", md: "md" }}>
                  {style}
                </Badge>
              ))}
            </Flex>
          )}

          {/* Track count and date added */}
          <Flex gap={{ base: 2, md: 4 }} fontSize={{ base: "xs", md: "sm" }} color={subtleText}>
            {album.track_count && <Text>{album.track_count} tracks</Text>}
            {album.date_added && <Text>Added: {formatDate(album.date_added)}</Text>}
          </Flex>

          {/* Notes display (when not editing) */}
          {!isEditing && album.album_notes && (
            <Box p={{ base: 2, md: 3 }} bg={panelBg} borderRadius="md" borderWidth="1px">
              <Text fontSize={{ base: "sm", md: "md" }}>{album.album_notes}</Text>
            </Box>
          )}

          {/* Purchase info display */}
          {!isEditing && (album.purchase_price || album.condition) && (
            <Flex gap={{ base: 2, md: 4 }} fontSize={{ base: "xs", md: "md" }} color={mutedText}>
              {album.purchase_price && <Text>Price: ${album.purchase_price}</Text>}
              {album.condition && <Text>Condition: {album.condition}</Text>}
            </Flex>
          )}

          {/* Edit form */}
          {isEditing && (
            <Box mt={2} p={4} borderWidth="1px" borderRadius="md" bg={panelBg}>
              <Flex direction="column" gap={3}>
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={1}>
                    Notes
                  </Text>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this album..."
                    size="sm"
                  />
                </Box>

                <Flex gap={3}>
                  <Box flex="1">
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      Purchase Price
                    </Text>
                    <Input
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder="25.99"
                      size="sm"
                      type="number"
                      step="0.01"
                    />
                  </Box>

                  <Box flex="1">
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      Condition
                    </Text>
                    <Input
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      placeholder="Near Mint, VG+, etc."
                      size="sm"
                    />
                  </Box>
                </Flex>

                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={1}>
                    Library Identifier (e.g., LP001)
                  </Text>
                  <Input
                    value={libraryIdentifier}
                    onChange={(e) => setLibraryIdentifier(e.target.value)}
                    placeholder="LP001"
                    size="sm"
                    maxLength={50}
                  />
                </Box>

                <Flex gap={2} mt={2}>
                  <Button size="sm" colorScheme="blue" onClick={handleSave}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setNotes(album.album_notes || "");
                      setPurchasePrice(album.purchase_price?.toString() || "");
                      setCondition(album.condition || "");
                      setLibraryIdentifier(album.library_identifier || "");
                    }}
                  >
                    Cancel
                  </Button>
                </Flex>
              </Flex>
            </Box>
          )}

          {/* Action menu */}
          <Box mt={2}>
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Album actions"
                >
                  <FiMoreVertical />
                  <Box ml={2}>Actions</Box>
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  {tracks.length > 0 && (
                    <Menu.Item value="play" onSelect={handleEnqueueAlbum}>
                      <FiPlay /> Play Album
                    </Menu.Item>
                  )}

                  {tracks.length > 0 && (
                    <Menu.Item
                      value="download"
                      onSelect={handleDownloadAlbum}
                      disabled={isDownloading}
                    >
                      <FiDownload /> {isDownloading ? "Downloading..." : "Download Missing"}
                    </Menu.Item>
                  )}

                  {album.discogs_url && (
                    <Menu.Item
                      value="discogs"
                      asChild
                    >
                      <Link href={album.discogs_url} target="_blank" rel="noopener noreferrer">
                        <Icon as={SiDiscogs} /> View on Discogs
                      </Link>
                    </Menu.Item>
                  )}

                  {!isEditing && (
                    <Menu.Item value="edit" onSelect={() => setIsEditing(true)}>
                      <FiEdit /> Edit Details
                    </Menu.Item>
                  )}

                  <Menu.Item
                    value="edit-album"
                    asChild
                  >
                    <Link href={`/albums/${releaseId}/edit?friend_id=${friendId}`}>
                      <FiEdit /> Edit Album & Tracks
                    </Link>
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          </Box>
        </Flex>
      </Flex>

      {/* Track list */}
      <Box>

        {tracks.length === 0 ? (
          <Text color={subtleText}>No tracks found for this album.</Text>
        ) : (
          <Flex direction="column" gap={{ base: 1, md: 2 }}>
            {tracks.map((track, idx) => (
              <AlbumTrackItem
                key={`${track.track_id}:${track.friend_id}:${idx}`}
                track={track}
                albumArtist={album.artist}
                buttons={
                  <TrackActionsMenu
                    key={`${track.track_id}:${track.friend_id}:${idx}:actions`}
                    track={track}
                  />
                }
              />
            ))}
          </Flex>
        )}
      </Box>

      <Box mt={8} borderWidth="1px" borderRadius="md" p={4}>
        <Heading size="sm" mb={3}>
          Discogs Raw Release File
        </Heading>
        {discogsRawQuery.isLoading ? (
          <Spinner size="sm" />
        ) : discogsRawQuery.error ? (
          <Text color={subtleText}>
            {discogsRawQuery.error instanceof Error
              ? discogsRawQuery.error.message
              : "No Discogs raw file found"}
          </Text>
        ) : discogsRawQuery.data ? (
          <Box>
            <Badge variant="outline" mb={3}>
              {discogsRawQuery.data.file_path}
            </Badge>
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
              {JSON.stringify(discogsRawQuery.data.data, null, 2)}
            </Box>
          </Box>
        ) : (
          <Text color={subtleText}>No Discogs raw file available.</Text>
        )}
      </Box>
    </PageContainer>
  );
}

export default function AlbumDetailPage() {
  return (
    <Suspense
      fallback={
        <PageContainer size="standard" py={8}>
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" />
          </Flex>
        </PageContainer>
      }
    >
      <AlbumDetailContent />
    </Suspense>
  );
}
