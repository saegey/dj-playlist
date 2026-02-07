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
import { Album } from "@/types/track";
import { useUpdateAlbumMutation } from "@/hooks/useAlbumsQuery";

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export type AlbumResultProps = {
  album: Album;
  buttons?: React.ReactNode;
  showEditFields?: boolean;
};

export default function AlbumResult({
  album,
  buttons,
  showEditFields = false,
}: AlbumResultProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(album.album_rating || 0);
  const [notes, setNotes] = useState(album.album_notes || "");
  const [purchasePrice, setPurchasePrice] = useState(
    album.purchase_price?.toString() || ""
  );
  const [condition, setCondition] = useState(album.condition || "");
  const [libraryIdentifier, setLibraryIdentifier] = useState(
    album.library_identifier || ""
  );
  const mutedText = useColorModeValue("gray.600", "gray.300");
  const subtleText = useColorModeValue("gray.500", "gray.400");
  const panelBg = useColorModeValue("gray.50", "gray.900");
  const panelBorder = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("blue.600", "blue.300");

  const updateMutation = useUpdateAlbumMutation();

  const handleSave = async () => {
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

  return (
    <Box borderWidth="1px" borderRadius="md" p={4} mb={3} position="relative">
      <Flex gap={4} direction={{ base: "column", md: "row" }}>
        {/* Album artwork */}
        {album.album_thumbnail && (
          <Box flexShrink={0}>
            <Image
              src={album.album_thumbnail}
              alt={album.title}
              boxSize={{ base: "120px", md: "150px" }}
              objectFit="cover"
              borderRadius="md"
            />
          </Box>
        )}

        {/* Album details */}
        <Flex flex="1" direction="column" gap={2}>
          {/* Title and Artist */}
          <Flex direction="column" gap={1}>
            <Flex alignItems="center" gap={2} flexWrap="wrap">
              {album.library_identifier && (
                <Badge colorPalette="blue" size="md" variant="solid" fontWeight="bold">
                  {album.library_identifier}
                </Badge>
              )}
              <Link
                as={NextLink}
                href={`/albums/${album.release_id}?friend_id=${album.friend_id}`}
                _hover={{ textDecoration: "underline" }}
              >
                <Text fontWeight="bold" fontSize="lg" color={titleColor}>
                  {album.title}
                </Text>
              </Link>
            </Flex>
            <Link
              as={NextLink}
              href={`/albums?q=${encodeURIComponent(album.artist)}&friend_id=${album.friend_id}`}
              _hover={{ textDecoration: "underline" }}
            >
              <Text fontSize="md" color={mutedText}>
                {album.artist}
              </Text>
            </Link>
          </Flex>

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
              size="sm"
            >
              {[1, 2, 3, 4, 5].map((index) => (
                <RatingGroup.Item key={index} index={index}>
                  <RatingGroup.ItemIndicator />
                </RatingGroup.Item>
              ))}
            </RatingGroup.Root>
            <Text fontSize="sm" color={subtleText}>
              ({rating}/5)
            </Text>
          </Flex>

          {/* Metadata */}
          <Flex gap={3} flexWrap="wrap" fontSize="sm" color={mutedText}>
            {album.year && <Text>{album.year}</Text>}
            {album.format && <Text>{album.format}</Text>}
            {album.label && <Text>{album.label}</Text>}
            {album.catalog_number && <Text>Cat: {album.catalog_number}</Text>}
            {album.country && <Text>{album.country}</Text>}
            {album.track_count && (
              <Text>{album.track_count} tracks</Text>
            )}
          </Flex>

          {/* Genres and Styles */}
          {(album.genres || album.styles) && (
            <Flex gap={1} flexWrap="wrap">
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

          {/* Date added */}
          {album.date_added && (
            <Text fontSize="sm" color={subtleText}>
              Added: {formatDate(album.date_added)}
            </Text>
          )}

          {/* Editable fields */}
          {showEditFields && isEditing && (
            <Box
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

          {/* Notes display (when not editing) */}
          {!isEditing && album.album_notes && (
            <Box p={2} bg={panelBg} borderRadius="md" borderWidth="1px" borderColor={panelBorder}>
              <Text fontSize="sm">{album.album_notes}</Text>
            </Box>
          )}

          {/* Purchase info display */}
          {!isEditing && (album.purchase_price || album.condition) && (
            <Flex gap={3} fontSize="sm" color={mutedText}>
              {album.purchase_price && (
                <Text>Price: ${album.purchase_price}</Text>
              )}
              {album.condition && <Text>Condition: {album.condition}</Text>}
            </Flex>
          )}

          {/* Action buttons */}
          <Flex gap={2} mt={2} alignItems="center">
            {/* Discogs link */}
            {album.discogs_url && (
              <Link href={album.discogs_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost">
                  <Icon as={SiDiscogs} mr={2} />
                  Discogs
                </Button>
              </Link>
            )}

            {/* Edit button */}
            {showEditFields && !isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit Details
              </Button>
            )}

            {/* Custom action buttons */}
            {buttons}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}
