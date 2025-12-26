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
  VStack,
  Spinner,
} from "@chakra-ui/react";
import { SiYoutube } from "react-icons/si";
import type { YoutubeVideo } from "@/types/track";

type Props = {
  open: boolean;
  loading: boolean;
  results: YoutubeVideo[];
  onOpenChange: (open: boolean) => void;
  onSelect: (video: YoutubeVideo) => void;
  initialTitle?: string;
  initialArtist?: string;
  onSearch?: (title: string, artist: string) => void;
};

export default function YouTubePickerDialog({
  open,
  loading,
  results,
  onOpenChange,
  onSelect,
  initialTitle = "",
  initialArtist = "",
  onSearch,
}: Props) {
  // Local state for editable search query
  const [searchTitle, setSearchTitle] = React.useState(initialTitle);
  const [searchArtist, setSearchArtist] = React.useState(initialArtist);

  // Sync with initial values when dialog opens
  React.useEffect(() => {
    if (open) {
      setSearchTitle(initialTitle);
      setSearchArtist(initialArtist);
    }
  }, [open, initialTitle, initialArtist]);

  const handleSearch = () => {
    if (onSearch && searchTitle && searchArtist) {
      onSearch(searchTitle, searchArtist);
    }
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
              <Dialog.Title>Select YouTube Video</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                {/* Search Query Section */}
                {onSearch && (
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
                        colorPalette="red"
                        onClick={handleSearch}
                        loading={loading}
                        disabled={!searchTitle || !searchArtist}
                      >
                        <SiYoutube /> Search YouTube
                      </Button>
                    </VStack>
                  </Box>
                )}

                {/* Results Section */}
                {loading ? (
                  <Flex justify="center" align="center" py={8} gap={3}>
                    <Spinner size="lg" />
                    <Text>Searching YouTube...</Text>
                  </Flex>
                ) : results.length === 0 ? (
                  <Box py={4} textAlign="center">
                    <Text color="gray.500">
                      {onSearch
                        ? "No results found. Try adjusting your search above."
                        : "No results found."}
                    </Text>
                  </Box>
                ) : (
                  <Stack>
                    <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
                      {results.length} result{results.length !== 1 ? "s" : ""} found
                    </Text>
                    {results.map((video) => (
                      <Flex
                        key={video.id}
                        align="center"
                        gap={3}
                        borderWidth="1px"
                        borderRadius="md"
                        p={2}
                        _hover={{ bg: "bg.subtle", cursor: "pointer" }}
                        onClick={() => onSelect(video)}
                      >
                        {video.thumbnail && (
                          <Image
                            src={video.thumbnail}
                            alt={video.title}
                            boxSize="60px"
                            borderRadius="md"
                          />
                        )}
                        <Box flex="1">
                          <Text fontWeight="bold">{video.title}</Text>
                          {video.channel && (
                            <Text fontSize="sm" color="fg.muted">{video.channel}</Text>
                          )}
                        </Box>
                        <Button
                          colorPalette="red"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(video);
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
