"use client";
import React, { useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Flex,
  Text,
  Link,
  Image,
  Button,
  Icon,
  RatingGroup,
  Badge,
  Input,
  Textarea,
} from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import { SiDiscogs } from "react-icons/si";
import { FiEdit } from "react-icons/fi";
import { Album } from "@/types/track";
import { useUpdateAlbumMutation } from "@/hooks/useAlbumsQuery";
import { useAlbum } from "@/hooks/useAlbum";

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export type AlbumResultProps = {
  album?: Album;
  albumRef?: { release_id: string; friend_id: number };
  buttons?: React.ReactNode;
  showEditFields?: boolean;
};

export default function AlbumResult({
  album,
  albumRef,
  buttons,
  showEditFields = false,
}: AlbumResultProps) {
  const releaseId = albumRef?.release_id ?? album?.release_id ?? "";
  const friendId = albumRef?.friend_id ?? album?.friend_id ?? -1;
  const albumFromStore = useAlbum(releaseId, friendId);
  const resolvedAlbum = albumFromStore ?? album;

  const artworkSrc =
    resolvedAlbum?.audio_file_album_art_url ||
    resolvedAlbum?.album_thumbnail ||
    "/images/placeholder-artwork.png";
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(resolvedAlbum?.album_rating || 0);
  const [notes, setNotes] = useState(resolvedAlbum?.album_notes || "");
  const [purchasePrice, setPurchasePrice] = useState(
    resolvedAlbum?.purchase_price?.toString() || ""
  );
  const [condition, setCondition] = useState(resolvedAlbum?.condition || "");
  const [libraryIdentifier, setLibraryIdentifier] = useState(
    resolvedAlbum?.library_identifier || ""
  );
  const mutedText = useColorModeValue("gray.600", "gray.300");
  const subtleText = useColorModeValue("gray.500", "gray.400");
  const panelBg = useColorModeValue("gray.50", "gray.900");
  const panelBorder = useColorModeValue("gray.200", "gray.700");

  const updateMutation = useUpdateAlbumMutation();

  React.useEffect(() => {
    if (isEditing || !resolvedAlbum) return;
    setRating(resolvedAlbum.album_rating || 0);
    setNotes(resolvedAlbum.album_notes || "");
    setPurchasePrice(resolvedAlbum.purchase_price?.toString() || "");
    setCondition(resolvedAlbum.condition || "");
    setLibraryIdentifier(resolvedAlbum.library_identifier || "");
  }, [
    isEditing,
    resolvedAlbum,
    resolvedAlbum?.album_rating,
    resolvedAlbum?.album_notes,
    resolvedAlbum?.purchase_price,
    resolvedAlbum?.condition,
    resolvedAlbum?.library_identifier,
  ]);

  const handleSave = async () => {
    if (!resolvedAlbum) return;
    await updateMutation.mutateAsync({
      release_id: resolvedAlbum.release_id,
      friend_id: resolvedAlbum.friend_id,
      album_rating: rating,
      album_notes: notes,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
      condition: condition || undefined,
      library_identifier: libraryIdentifier || null,
    });
    setIsEditing(false);
  };

  const resetForm = () => {
    setIsEditing(false);
    setNotes(resolvedAlbum?.album_notes || "");
    setPurchasePrice(resolvedAlbum?.purchase_price?.toString() || "");
    setCondition(resolvedAlbum?.condition || "");
    setLibraryIdentifier(resolvedAlbum?.library_identifier || "");
  };

  if (!resolvedAlbum) return null;

  const displayGenres = resolvedAlbum.genres ?? [];
  const displayStyles = resolvedAlbum.styles ?? [];

  return (
    <Box
      borderWidth={[0, "1px"]}
      borderBottomWidth={["1px", "1px"]}
      borderRadius={[0, "md"]}
      p={[0, 3]}
      mb={2}
      width="100%"
    >
      <Flex gap={3} position="relative" width="100%">
        <Box
          flexShrink={0}
          width={{ base: "70px", md: "80px", lg: "90px" }}
          height={{ base: "70px", md: "80px", lg: "90px" }}
        >
          <Image
            src={artworkSrc}
            alt={resolvedAlbum.title}
            width="100%"
            height="100%"
            objectFit="cover"
            borderRadius="md"
          />
        </Box>

        <Flex direction="column" flex={1} minW={0} gap={1}>
          <Flex alignItems="center" gap={2} pr={{ base: 14, lg: 24 }}>
            {resolvedAlbum.library_identifier && (
              <Badge colorPalette="blue" size="sm" fontWeight="bold" flexShrink={0}>
                {resolvedAlbum.library_identifier}
              </Badge>
            )}
            <Text
              fontSize={{ base: "sm", md: "lg" }}
              fontWeight="bold"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              flex="1 1 auto"
              minW={0}
            >
              <Link
                as={NextLink}
                href={`/albums/${resolvedAlbum.release_id}?friend_id=${resolvedAlbum.friend_id}`}
                _hover={{ textDecoration: "underline" }}
              >
                {resolvedAlbum.title}
              </Link>
            </Text>
          </Flex>

          <Link
            as={NextLink}
            href={`/albums?q=${encodeURIComponent(resolvedAlbum.artist)}&friend_id=${resolvedAlbum.friend_id}`}
            _hover={{ textDecoration: "underline" }}
          >
            <Text
              fontSize={{ base: "xs", md: "sm" }}
              fontWeight="medium"
              color={mutedText}
              lineClamp={1}
            >
              {resolvedAlbum.artist}
            </Text>
          </Link>

          <Flex gap={2} fontSize="xs" color="gray.500" alignItems="center" flexWrap="wrap">
            {resolvedAlbum.year && <Text>{resolvedAlbum.year}</Text>}
            {resolvedAlbum.track_count > 0 && (
              <>
                <Text color="gray.400">·</Text>
                <Text>
                  {resolvedAlbum.track_count} track{resolvedAlbum.track_count !== 1 ? "s" : ""}
                </Text>
              </>
            )}
            {resolvedAlbum.username && (
              <>
                <Text color="gray.400">·</Text>
                <Text>{resolvedAlbum.username}</Text>
              </>
            )}
          </Flex>

          <Flex
            gap={3}
            fontSize="xs"
            flexWrap="wrap"
            alignItems="center"
            color="gray.500"
            mt={0.5}
          >
            <RatingGroup.Root
              value={rating}
              onValueChange={(details) => {
                setRating(details.value);
                if (!isEditing) {
                  updateMutation.mutate({
                    release_id: resolvedAlbum.release_id,
                    friend_id: resolvedAlbum.friend_id,
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
            {resolvedAlbum.format && <Text>{resolvedAlbum.format}</Text>}
            {resolvedAlbum.label && (
              <Text display={{ base: "none", md: "block" }}>{resolvedAlbum.label}</Text>
            )}
            {resolvedAlbum.catalog_number && (
              <Text display={{ base: "none", md: "block" }}>Cat: {resolvedAlbum.catalog_number}</Text>
            )}
            {resolvedAlbum.country && (
              <Text display={{ base: "none", md: "block" }}>{resolvedAlbum.country}</Text>
            )}
            {resolvedAlbum.date_added && (
              <Text display={{ base: "none", md: "block" }}>
                Added: {formatDate(resolvedAlbum.date_added)}
              </Text>
            )}
          </Flex>

          {(displayGenres.length > 0 || displayStyles.length > 0) && (
            <Flex gap={2} flexWrap="wrap" display={{ base: "none", md: "flex" }} mt={0.5}>
              {displayGenres.map((genre) => (
                <Badge key={genre} size="sm" variant="surface">
                  {genre}
                </Badge>
              ))}
              {displayStyles.map((style) => (
                <Badge key={style} size="sm" variant="outline">
                  {style}
                </Badge>
              ))}
            </Flex>
          )}
        </Flex>

        <Flex position="absolute" top={2} right={2} gap={1} alignItems="center">
          {resolvedAlbum.discogs_url && (
            <Link href={resolvedAlbum.discogs_url} target="_blank" rel="noopener noreferrer">
              <Button size="xs" variant="ghost" px={2}>
                <Icon as={SiDiscogs} />
                <Box display={{ base: "none", lg: "inline" }} ml={2}>
                  Discogs
                </Box>
              </Button>
            </Link>
          )}

          {showEditFields && !isEditing && (
            <Button size="xs" variant="outline" onClick={() => setIsEditing(true)} px={2}>
              <Icon as={FiEdit} />
              <Box display={{ base: "none", lg: "inline" }} ml={2}>
                Edit
              </Box>
            </Button>
          )}

          {buttons}
        </Flex>
      </Flex>

      {!isEditing && resolvedAlbum.album_notes && (
        <Box
          mt={3}
          p={2}
          bg={panelBg}
          borderRadius="md"
          borderWidth="1px"
          borderColor={panelBorder}
        >
          <Text fontSize="sm">{resolvedAlbum.album_notes}</Text>
        </Box>
      )}

      {!isEditing && (resolvedAlbum.purchase_price || resolvedAlbum.condition) && (
        <Flex mt={3} gap={3} fontSize="sm" color={subtleText} flexWrap="wrap">
          {resolvedAlbum.purchase_price && <Text>Price: ${resolvedAlbum.purchase_price}</Text>}
          {resolvedAlbum.condition && <Text>Condition: {resolvedAlbum.condition}</Text>}
        </Flex>
      )}

      {showEditFields && isEditing && (
        <Box
          mt={3}
          p={3}
          borderWidth="1px"
          borderRadius="md"
          bg={panelBg}
          borderColor={panelBorder}
        >
          <Flex direction="column" gap={2}>
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

            <Flex gap={2} direction={{ base: "column", md: "row" }}>
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
              <Button size="sm" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            </Flex>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
