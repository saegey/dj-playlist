"use client";

import React from "react";
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Flex,
  Image,
  Portal,
  Stack,
  Text,
  Input,
  HStack,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import { SiApplemusic } from "react-icons/si";
import type { AppleMusicResult } from "@/types/track";
import { useAppleMusicAISearchQuery } from "@/hooks/useAppleMusicAISearchQuery";
import { TrackEditFormProps } from "./TrackEditForm";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (song: AppleMusicResult) => void;
  track: TrackEditFormProps;
};

export default function AppleMusicPickerDialog({
  open,
  onOpenChange,
  onSelect,
  track,
}: Props) {
  // Local state for editable search query
  const [searchTitle, setSearchTitle] = React.useState(track.title || "");
  const [searchArtist, setSearchArtist] = React.useState(track.artist || "");

  // Sync with track when dialog opens
  React.useEffect(() => {
    if (open) {
      setSearchTitle(track.title || "");
      setSearchArtist(track.artist || "");
    }
  }, [open, track.title, track.artist]);

  const { isPending: aiAppleLoading, data, refetch } = useAppleMusicAISearchQuery(
    { title: searchTitle, artist: searchArtist },
    open && !!searchTitle && !!searchArtist
  );

  const handleSearch = () => {
    refetch();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(d) => onOpenChange(d.open)}
      size={["full", "lg", "lg"]}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Select Apple Music Track</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                {/* Search Query Section */}
                <Box
                  p={3}
                  borderWidth="1px"
                  borderRadius="md"
                  bg="bg.subtle"
                >
                  <Text fontSize="sm" fontWeight="semibold" mb={2} color="fg.muted">
                    Current Search Query
                  </Text>
                  <VStack align="stretch" gap={2}>
                    <Box>
                      <Text fontSize="xs" mb={1} color="fg.muted">
                        Title
                      </Text>
                      <Input
                        value={searchTitle}
                        onChange={(e) => setSearchTitle(e.target.value)}
                        placeholder="Track title"
                        size="sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSearch();
                        }}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="xs" mb={1} color="fg.muted">
                        Artist
                      </Text>
                      <Input
                        value={searchArtist}
                        onChange={(e) => setSearchArtist(e.target.value)}
                        placeholder="Artist name"
                        size="sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSearch();
                        }}
                      />
                    </Box>
                    <Button
                      size="sm"
                      colorPalette="blue"
                      onClick={handleSearch}
                      loading={aiAppleLoading}
                      disabled={!searchTitle || !searchArtist}
                    >
                      <SiApplemusic /> Search Apple Music
                    </Button>
                  </VStack>
                </Box>

                {/* Results Section */}
                {aiAppleLoading ? (
                  <Flex justify="center" align="center" py={8} gap={3}>
                    <Spinner size="lg" />
                    <Text>Searching Apple Music...</Text>
                  </Flex>
                ) : data?.results.length === 0 ? (
                  <Box py={4} textAlign="center">
                    <Text color="gray.500">
                      No results found. Try adjusting your search above.
                    </Text>
                  </Box>
                ) : (
                  <Stack>
                    <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
                      {data?.results.length} result{data?.results.length !== 1 ? "s" : ""} found
                    </Text>
                    {data?.results.map((song) => (
                      <Flex
                        key={song.id}
                        align="center"
                        gap={3}
                        borderWidth="1px"
                        borderRadius="md"
                        p={2}
                        _hover={{ bg: "bg.subtle", cursor: "pointer" }}
                        onClick={() => onSelect(song)}
                      >
                        {song.artwork && (
                          <Image
                            src={song.artwork.replace("{w}x{h}bb", "60x60bb")}
                            alt={song.title}
                            boxSize="60px"
                            borderRadius="md"
                          />
                        )}
                        <Box flex="1">
                          <Text fontWeight="bold">{song.title}</Text>
                          <Text fontSize="sm" color="fg.muted">
                            {song.artist} — {song.album}
                          </Text>
                        </Box>
                        <Button
                          colorPalette="blue"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(song);
                          }}
                        >
                          Select
                        </Button>
                      </Flex>
                    ))}
                  </Stack>
                )}
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
