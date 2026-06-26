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
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import { SiDiscogs } from "react-icons/si";
import { FiPlay, FiDownload, FiEdit, FiMoreVertical, FiFileText } from "react-icons/fi";
import NextLink from "next/link";

import { useAlbumDetailQuery, useUpdateAlbumMutation } from "@/hooks/useAlbumsQuery";
import { useAlbum, useAlbumHydrated } from "@/hooks/useAlbum";
import { useTracksByRelease, useTracksByReleaseHydrated } from "@/hooks/useTrack";
import AlbumTrackItem from "@/components/AlbumTrackItem";
import AlbumSpinPanel from "@/components/spins/AlbumSpinPanel";
import TrackActionsMenu from "@/components/TrackActionsMenu";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { toaster } from "@/components/ui/toaster";
import { useColorModeValue } from "@/components/ui/color-mode";
import PageContainer from "@/components/layout/PageContainer";
import {
  compareTrackPositions,
  normalizeAlbumTrackSides,
} from "@/lib/albumTrackPosition";
import {
  formatSeconds,
  getTrackDurationSeconds,
} from "@/lib/trackUtils";
import {
  fetchAlbumDiscogsRawRelease,
  queueAlbumDownloads,
} from "@/services/internalApi/albums";
import { fetchPlaylistCounts } from "@/services/internalApi/tracks";
import { queryKeys } from "@/lib/queryKeys";

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
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
    queryFn: () => fetchAlbumDiscogsRawRelease(releaseId, friendId),
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
  const [discogsRawModalOpen, setDiscogsRawModalOpen] = React.useState(false);

  const panelBg = useColorModeValue("gray.50", "gray.800");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const subtleText = useColorModeValue("gray.500", "gray.500");
  const album = albumFromStore;
  const tracks = React.useMemo(() => {
    return [...tracksFromStore].sort((a, b) =>
      compareTrackPositions(a.position, b.position)
    );
  }, [tracksFromStore]);
  const trackRefs = React.useMemo(
    () =>
      tracks.map((track) => ({
        track_id: track.track_id,
        friend_id: track.friend_id,
      })),
    [tracks]
  );
  const playlistCountsQuery = useQuery({
    queryKey: queryKeys.playlistCounts(
      trackRefs.map((track) => `${track.track_id}:${track.friend_id}`)
    ),
    queryFn: () => fetchPlaylistCounts(trackRefs),
    enabled: trackRefs.length > 0,
    staleTime: 30_000,
  });
  const trackSections = React.useMemo(() => {
    return normalizeAlbumTrackSides(tracks).map((group) => ({
      label: group.side_label,
      tracks: group.tracks,
    }));
  }, [tracks]);
  const hasSideSections = trackSections.some((section) =>
    section.label.startsWith("Side ") || section.label.startsWith("Disc ")
  );
  const albumDurationSeconds = React.useMemo(() => {
    return tracks.reduce((total, track) => {
      return total + (getTrackDurationSeconds(track) ?? 0);
    }, 0);
  }, [tracks]);

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
      const result = await queueAlbumDownloads(releaseId, friendId);

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
      <Flex
        borderWidth={[0, "1px"]}
        borderBottomWidth={["1px", "1px"]}
        borderRadius={[0, "md"]}
        p={[0, 3]}
        mb={{ base: 4, md: 6 }}
        gap={3}
        position="relative"
        width="100%"
        direction={{ base: "row", md: "row" }}
      >
        {albumArtwork && (
          <Box
            flexShrink={0}
            width={{ base: "90px", md: "130px" }}
            height={{ base: "90px", md: "130px" }}
          >
            <Image
              src={albumArtwork}
              alt={album.title}
              width="100%"
              height="100%"
              objectFit="cover"
              borderRadius="md"
            />
          </Box>
        )}

        <Flex flex="1" direction="column" gap={1.5} minW={0} pr={{ base: 9, md: 10 }}>
          <Box>
            <Flex alignItems="center" gap={2} flexWrap="wrap">
              {album.library_identifier && (
                <Badge colorPalette="blue" size={{ base: "sm", md: "md" }} variant="solid" fontWeight="bold">
                  {album.library_identifier}
                </Badge>
              )}
              <Heading
                size={{ base: "md", md: "lg" }}
                lineClamp={{ base: 2, md: 3 }}
                lineHeight={{ base: "1.3", md: "1.4" }}
              >
                {album.title}
              </Heading>
            </Flex>
            <Link
              asChild
              _hover={{ textDecoration: "underline" }}
            >
              <NextLink href={`/albums?q=${encodeURIComponent(album.artist)}`}>
                <Text fontSize={{ base: "xs", md: "sm" }} color={mutedText} fontWeight="medium">
                  {album.artist}
                </Text>
              </NextLink>
            </Link>
          </Box>

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
              size="xs"
            >
              {[1, 2, 3, 4, 5].map((index) => (
                <RatingGroup.Item key={index} index={index}>
                  <RatingGroup.ItemIndicator />
                </RatingGroup.Item>
              ))}
            </RatingGroup.Root>
            <Text fontSize="xs" color={subtleText}>
              ({rating}/5)
            </Text>
          </Flex>

          <Flex gap={2} flexWrap="wrap" fontSize="xs" color={mutedText}>
            {album.year && <Text fontWeight="semibold">{album.year}</Text>}
            {album.format && <Text>{album.format}</Text>}
            {album.label && <Text display={{ base: "none", md: "block" }}>{album.label}</Text>}
            {album.catalog_number && <Text display={{ base: "none", md: "block" }}>Cat: {album.catalog_number}</Text>}
            {album.country && <Text display={{ base: "none", md: "block" }}>{album.country}</Text>}
          </Flex>

          {(album.genres || album.styles) && (
            <Flex gap={1} flexWrap="wrap" display={{ base: "none", md: "flex" }}>
              {album.genres?.map((genre) => (
                <Badge key={genre} colorScheme="blue" size="sm">
                  {genre}
                </Badge>
              ))}
              {album.styles?.map((style) => (
                <Badge key={style} colorScheme="purple" size="sm">
                  {style}
                </Badge>
              ))}
            </Flex>
          )}

          <Flex gap={2} fontSize="xs" color={subtleText} flexWrap="wrap">
            {album.track_count && <Text>{album.track_count} tracks</Text>}
            {albumDurationSeconds > 0 && <Text>{formatSeconds(albumDurationSeconds)}</Text>}
            {album.date_added && <Text display={{ base: "none", md: "block" }}>Added: {formatDate(album.date_added)}</Text>}
          </Flex>

          {!isEditing && album.album_notes && (
            <Box p={3} bg={panelBg} borderRadius="md" borderWidth="1px" mt={1}>
              <Text fontSize="sm">{album.album_notes}</Text>
            </Box>
          )}

          {!isEditing && (album.purchase_price || album.condition) && (
            <Flex gap={2} fontSize="xs" color={mutedText}>
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

        </Flex>

        <Flex position="absolute" top={2} right={2} gap={1} alignItems="center">
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Album actions"
                minW="32px"
                h="32px"
                p={0}
              >
                <FiMoreVertical />
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

                <Menu.Item
                  value="discogs-raw"
                  onSelect={() => setDiscogsRawModalOpen(true)}
                >
                  <FiFileText /> View Raw Discogs File
                </Menu.Item>

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
        </Flex>
      </Flex>

      <AlbumSpinPanel
        releaseId={releaseId}
        friendId={friendId}
        albumTitle={album.title}
      />

      {/* Track list */}
      <Box>

        {tracks.length === 0 ? (
          <Text color={subtleText}>No tracks found for this album.</Text>
        ) : (
          <Flex direction="column" gap={{ base: 4, md: 6 }}>
            {trackSections.map((section) => (
              <Box key={section.label}>
                {(hasSideSections || section.label !== "Tracklist") && (
                  <Flex
                    alignItems="center"
                    gap={3}
                    mb={{ base: 2, md: 3 }}
                  >
                    <Heading size={{ base: "sm", md: "md" }}>
                      {section.label}
                    </Heading>
                    <Box flex="1" borderTopWidth="1px" />
                    <Text fontSize="xs" color={subtleText} whiteSpace="nowrap">
                      {section.tracks.length}{" "}
                      {section.tracks.length === 1 ? "track" : "tracks"}
                    </Text>
                  </Flex>
                )}
                <Flex
                  direction="column"
                  borderWidth="1px"
                  borderRadius="md"
                  overflow="hidden"
                >
                  {section.tracks.map((track, idx) => (
                    <AlbumTrackItem
                      key={`${track.track_id}:${track.friend_id}:${idx}`}
                      track={track}
                      albumArtist={album.artist}
                      playlistCount={
                        playlistCountsQuery.data?.[
                          `${track.track_id}:${track.friend_id}`
                        ] ?? 0
                      }
                      buttons={
                        <TrackActionsMenu
                          key={`${track.track_id}:${track.friend_id}:${idx}:actions`}
                          track={track}
                        />
                      }
                    />
                  ))}
                </Flex>
              </Box>
            ))}
          </Flex>
        )}
      </Box>

      <Dialog.Root
        open={discogsRawModalOpen}
        onOpenChange={(details) => setDiscogsRawModalOpen(details.open)}
        size="xl"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="980px" maxH="90vh">
              <Dialog.Header>
                <Dialog.Title>Discogs Raw Release File</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body overflowY="auto" pb={6}>
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
                      maxH="65vh"
                      fontSize="xs"
                      whiteSpace="pre-wrap"
                    >
                      {JSON.stringify(discogsRawQuery.data.data, null, 2)}
                    </Box>
                  </Box>
                ) : (
                  <Text color={subtleText}>No Discogs raw file available.</Text>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => setDiscogsRawModalOpen(false)}>
                  Close
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
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
