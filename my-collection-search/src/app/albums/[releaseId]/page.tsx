"use client";

import React, { Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Container,
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
} from "@chakra-ui/react";
import { SiDiscogs } from "react-icons/si";
import { IoArrowBack } from "react-icons/io5";
import { FiPlay, FiDownload } from "react-icons/fi";
import NextLink from "next/link";

import { useAlbumDetailQuery, useUpdateAlbumMutation } from "@/hooks/useAlbumsQuery";
import TrackResult from "@/components/TrackResult";
import TrackActionsMenu from "@/components/TrackActionsMenu";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { toaster } from "@/components/ui/toaster";

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function AlbumDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const releaseId = params.releaseId as string;
  const friendId = parseInt(searchParams.get("friend_id") || "0");

  const { data, isLoading, error } = useAlbumDetailQuery(releaseId, friendId);
  const updateMutation = useUpdateAlbumMutation();
  const { replacePlaylist } = usePlaylistPlayer();

  const [isEditing, setIsEditing] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [purchasePrice, setPurchasePrice] = React.useState("");
  const [condition, setCondition] = React.useState("");
  const [isDownloading, setIsDownloading] = React.useState(false);

  React.useEffect(() => {
    if (data?.album) {
      setRating(data.album.album_rating || 0);
      setNotes(data.album.album_notes || "");
      setPurchasePrice(data.album.purchase_price?.toString() || "");
      setCondition(data.album.condition || "");
    }
  }, [data]);

  const handleSave = async () => {
    if (!data?.album) return;

    await updateMutation.mutateAsync({
      release_id: data.album.release_id,
      friend_id: data.album.friend_id,
      album_rating: rating,
      album_notes: notes,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
      condition: condition || undefined,
    });
    setIsEditing(false);
  };

  const handleEnqueueAlbum = () => {
    if (!data?.tracks || data.tracks.length === 0) {
      toaster.create({
        title: "No Tracks",
        description: "This album has no tracks to play",
        type: "warning",
      });
      return;
    }

    replacePlaylist(data.tracks, {
      autoplay: true,
      startIndex: 0,
    });

    toaster.create({
      title: "Album Enqueued",
      description: `Playing ${data.album.title} by ${data.album.artist}`,
      type: "success",
    });
  };

  const handleDownloadAlbum = async () => {
    if (!data?.album) return;

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
      <Container maxW="container.xl" py={8}>
        <Text color="red.500">Error: friend_id parameter is required</Text>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text color="red.500">
          Error loading album: {error instanceof Error ? error.message : "Unknown error"}
        </Text>
      </Container>
    );
  }

  const { album, tracks } = data;

  return (
    <Container maxW="container.xl" py={6} mb={"100px"}>
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        mb={4}
      >
        <Icon as={IoArrowBack} mr={2} />
        Back
      </Button>

      {/* Album header */}
      <Flex gap={6} direction={{ base: "column", md: "row" }} mb={8}>
        {/* Album artwork */}
        {album.album_thumbnail && (
          <Box flexShrink={0}>
            <Image
              src={album.album_thumbnail}
              alt={album.title}
              boxSize={{ base: "200px", md: "300px" }}
              objectFit="cover"
              borderRadius="lg"
            />
          </Box>
        )}

        {/* Album info */}
        <Flex flex="1" direction="column" gap={3}>
          <Box>
            <Heading size="2xl" mb={2}>
              {album.title}
            </Heading>
            <Link
              as={NextLink}
              href={`/albums?q=${encodeURIComponent(album.artist)}`}
              _hover={{ textDecoration: "underline" }}
            >
              <Heading size="lg" color="gray.600" fontWeight="normal">
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
              size="lg"
            >
              {[1, 2, 3, 4, 5].map((index) => (
                <RatingGroup.Item key={index} index={index}>
                  <RatingGroup.ItemIndicator />
                </RatingGroup.Item>
              ))}
            </RatingGroup.Root>
            <Text fontSize="md" color="gray.500">
              ({rating}/5)
            </Text>
          </Flex>

          {/* Metadata */}
          <Flex gap={4} flexWrap="wrap" fontSize="md" color="gray.600">
            {album.year && <Text fontWeight="semibold">{album.year}</Text>}
            {album.format && <Text>{album.format}</Text>}
            {album.label && <Text>{album.label}</Text>}
            {album.catalog_number && <Text>Cat: {album.catalog_number}</Text>}
            {album.country && <Text>{album.country}</Text>}
          </Flex>

          {/* Genres and Styles */}
          {(album.genres || album.styles) && (
            <Flex gap={2} flexWrap="wrap">
              {album.genres?.map((genre) => (
                <Badge key={genre} colorScheme="blue" size="md">
                  {genre}
                </Badge>
              ))}
              {album.styles?.map((style) => (
                <Badge key={style} colorScheme="purple" size="md">
                  {style}
                </Badge>
              ))}
            </Flex>
          )}

          {/* Track count and date added */}
          <Flex gap={4} fontSize="sm" color="gray.500">
            {album.track_count && <Text>{album.track_count} tracks</Text>}
            {album.date_added && <Text>Added: {formatDate(album.date_added)}</Text>}
          </Flex>

          {/* Notes display (when not editing) */}
          {!isEditing && album.album_notes && (
            <Box p={3} bg="gray.50" borderRadius="md">
              <Text fontSize="md">{album.album_notes}</Text>
            </Box>
          )}

          {/* Purchase info display */}
          {!isEditing && (album.purchase_price || album.condition) && (
            <Flex gap={4} fontSize="md" color="gray.600">
              {album.purchase_price && <Text>Price: ${album.purchase_price}</Text>}
              {album.condition && <Text>Condition: {album.condition}</Text>}
            </Flex>
          )}

          {/* Edit form */}
          {isEditing && (
            <Box mt={2} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
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
                    }}
                  >
                    Cancel
                  </Button>
                </Flex>
              </Flex>
            </Box>
          )}

          {/* Action buttons */}
          <Flex gap={3} mt={2} flexWrap="wrap">
            {tracks.length > 0 && (
              <Button
                colorScheme="blue"
                onClick={handleEnqueueAlbum}
              >
                <FiPlay />Play Album
              </Button>
            )}

            {tracks.length > 0 && (
              <Button
                colorScheme="green"
                onClick={handleDownloadAlbum}
                loading={isDownloading}
                disabled={isDownloading}
              >
                <FiDownload />
                {isDownloading ? "Downloading..." : "Download Missing"}
              </Button>
            )}

            {album.discogs_url && (
              <Link href={album.discogs_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <Icon as={SiDiscogs} mr={2} />
                  View on Discogs
                </Button>
              </Link>
            )}

            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Details
              </Button>
            )}
          </Flex>
        </Flex>
      </Flex>

      {/* Track list */}
      <Box>
        <Heading size="lg" mb={4}>
          Tracks ({tracks.length})
        </Heading>

        {tracks.length === 0 ? (
          <Text color="gray.500">No tracks found for this album.</Text>
        ) : (
          <Flex direction="column" gap={3}>
            {tracks.map((track) => (
              <TrackResult
                key={track.track_id}
                track={track}
                showUsername={false}
                allowMinimize={false}
                buttons={<TrackActionsMenu track={track} />}
              />
            ))}
          </Flex>
        )}
      </Box>
    </Container>
  );
}

export default function AlbumDetailPage() {
  return (
    <Suspense
      fallback={
        <Container maxW="container.xl" py={8}>
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" />
          </Flex>
        </Container>
      }
    >
      <AlbumDetailContent />
    </Suspense>
  );
}
