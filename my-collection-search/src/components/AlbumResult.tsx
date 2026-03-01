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
  const titleColor = useColorModeValue("blue.600", "blue.300");

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

  if (!resolvedAlbum) return null;

  return (
    <Box borderWidth="1px" borderRadius="md" p={{ base: 2, md: 4 }} mb={{ base: 2, md: 3 }} position="relative">
      <Flex gap={{ base: 2, md: 4 }} direction={{ base: "row", md: "row" }} flexWrap={{ base: "wrap", md: "nowrap" }}>
        {artworkSrc && (
          <Box flexShrink={0}>
            <Image
              src={artworkSrc}
              alt={resolvedAlbum.title}
              boxSize={{ base: "80px", md: "150px" }}
              objectFit="cover"
              borderRadius="md"
            />
          </Box>
        )}

        <Flex flex="1" direction="column" gap={{ base: 1, md: 2 }} minW={0}>
          <Flex direction="column" gap={0.5}>
            <Flex alignItems="center" gap={1} flexWrap="wrap">
              {resolvedAlbum.library_identifier && (
                <Badge colorPalette="blue" size={{ base: "sm", md: "md" }} variant="solid" fontWeight="bold">
                  {resolvedAlbum.library_identifier}
                </Badge>
              )}
              <Link
                as={NextLink}
                href={`/albums/${resolvedAlbum.release_id}?friend_id=${resolvedAlbum.friend_id}`}
                _hover={{ textDecoration: "underline" }}
              >
                <Text
                  fontWeight="bold"
                  fontSize={{ base: "sm", md: "lg" }}
                  color={titleColor}
                  lineClamp={{ base: 2, md: 3 }}
                  lineHeight={{ base: "1.3", md: "1.4" }}
                >
                  {resolvedAlbum.title}
                </Text>
              </Link>
            </Flex>
            <Link
              as={NextLink}
              href={`/albums?q=${encodeURIComponent(resolvedAlbum.artist)}&friend_id=${resolvedAlbum.friend_id}`}
              _hover={{ textDecoration: "underline" }}
            >
              <Text
                fontSize={{ base: "xs", md: "md" }}
                color={mutedText}
                lineClamp={1}
              >
                {resolvedAlbum.artist}
              </Text>
            </Link>
          </Flex>

          <Flex alignItems="center" gap={1}>
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
              size={{ base: "xs", md: "sm" }}
            >
              {[1, 2, 3, 4, 5].map((index) => (
                <RatingGroup.Item key={index} index={index}>
                  <RatingGroup.ItemIndicator />
                </RatingGroup.Item>
              ))}
            </RatingGroup.Root>
            <Text fontSize="xs" color={subtleText} display={{ base: "none", md: "block" }}>
              ({rating}/5)
            </Text>
          </Flex>

          <Flex gap={2} flexWrap="wrap" fontSize={{ base: "xs", md: "sm" }} color={mutedText}>
            {resolvedAlbum.username && (
              <Badge colorPalette="purple" variant="subtle">
                {resolvedAlbum.username}
              </Badge>
            )}
            {resolvedAlbum.year && <Text>{resolvedAlbum.year}</Text>}
            {resolvedAlbum.format && <Text display={{ base: "none", md: "block" }}>{resolvedAlbum.format}</Text>}
            {resolvedAlbum.label && <Text display={{ base: "none", md: "block" }}>{resolvedAlbum.label}</Text>}
            {resolvedAlbum.catalog_number && <Text display={{ base: "none", md: "block" }}>Cat: {resolvedAlbum.catalog_number}</Text>}
            {resolvedAlbum.country && <Text display={{ base: "none", md: "block" }}>{resolvedAlbum.country}</Text>}
            {resolvedAlbum.track_count && (
              <Text>{resolvedAlbum.track_count} track{resolvedAlbum.track_count !== 1 ? "s" : ""}</Text>
            )}
          </Flex>

          {(resolvedAlbum.genres || resolvedAlbum.styles) && (
            <Flex gap={1} flexWrap="wrap" display={{ base: "none", md: "flex" }}>
              {resolvedAlbum.genres?.map((genre) => (
                <Badge key={genre} colorScheme="blue" size="sm">
                  {genre}
                </Badge>
              ))}
              {resolvedAlbum.styles?.map((style) => (
                <Badge key={style} colorScheme="purple" size="sm">
                  {style}
                </Badge>
              ))}
            </Flex>
          )}

          {resolvedAlbum.date_added && (
            <Text fontSize="sm" color={subtleText} display={{ base: "none", md: "block" }}>
              Added: {formatDate(resolvedAlbum.date_added)}
            </Text>
          )}

          {showEditFields && isEditing && (
            <Box
              display={{ base: "none", md: "block" }}
              mt={2}
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

                <Flex gap={2}>
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
                      setNotes(resolvedAlbum.album_notes || "");
                      setPurchasePrice(resolvedAlbum.purchase_price?.toString() || "");
                      setCondition(resolvedAlbum.condition || "");
                      setLibraryIdentifier(resolvedAlbum.library_identifier || "");
                    }}
                  >
                    Cancel
                  </Button>
                </Flex>
              </Flex>
            </Box>
          )}

          {!isEditing && resolvedAlbum.album_notes && (
            <Box p={2} bg={panelBg} borderRadius="md" borderWidth="1px" borderColor={panelBorder}>
              <Text fontSize="sm">{resolvedAlbum.album_notes}</Text>
            </Box>
          )}

          {!isEditing && (resolvedAlbum.purchase_price || resolvedAlbum.condition) && (
            <Flex gap={3} fontSize="sm" color={mutedText}>
              {resolvedAlbum.purchase_price && (
                <Text>Price: ${resolvedAlbum.purchase_price}</Text>
              )}
              {resolvedAlbum.condition && <Text>Condition: {resolvedAlbum.condition}</Text>}
            </Flex>
          )}

          <Flex gap={1} mt={{ base: 1, md: 2 }} alignItems="center" flexWrap="wrap">
            {resolvedAlbum.discogs_url && (
              <Link href={resolvedAlbum.discogs_url} target="_blank" rel="noopener noreferrer">
                <Button size={{ base: "xs", md: "sm" }} variant="ghost" px={{ base: 2, md: 3 }}>
                  <Icon as={SiDiscogs} />
                  <Box display={{ base: "none", md: "inline" }} ml={2}>
                    Discogs
                  </Box>
                </Button>
              </Link>
            )}

            {showEditFields && !isEditing && (
              <Button
                size={{ base: "xs", md: "sm" }}
                variant="outline"
                onClick={() => setIsEditing(true)}
                px={{ base: 2, md: 3 }}
              >
                <Icon as={FiEdit} />
                <Box display={{ base: "none", md: "inline" }} ml={2}>
                  Edit Details
                </Box>
              </Button>
            )}

            {buttons}
          </Flex>
        </Flex>
      </Flex>

      {showEditFields && isEditing && (
        <Box
          display={{ base: "block", md: "none" }}
          mt={2}
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

            <Flex gap={2}>
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
                  setNotes(resolvedAlbum.album_notes || "");
                  setPurchasePrice(resolvedAlbum.purchase_price?.toString() || "");
                  setCondition(resolvedAlbum.condition || "");
                  setLibraryIdentifier(resolvedAlbum.library_identifier || "");
                }}
              >
                Cancel
              </Button>
            </Flex>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
