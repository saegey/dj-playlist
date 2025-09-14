"use client";

import React from "react";
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  Spinner,
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import { FiPlus, FiSearch } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { fetchPlaylists } from "@/services/playlistService";
import { queryKeys } from "@/lib/queryKeys";
import type { Playlist } from "@/types/track";

interface PlaylistSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onPlaylistSelect: (playlist: Playlist) => void;
  onCreateNew: (name?: string) => void;
  title?: string;
}

export default function PlaylistSelectionDialog({
  open,
  onClose,
  onPlaylistSelect,
  onCreateNew,
  title = "Add to Playlist",
}: PlaylistSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch playlists
  const {
    data: playlists = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.playlists(),
    queryFn: fetchPlaylists,
    enabled: open,
  });

  // Filter playlists based on search query
  const filteredPlaylists = React.useMemo(() => {
    if (!searchQuery.trim()) return playlists;
    return playlists.filter((playlist: Playlist) =>
      playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [playlists, searchQuery]);

  // Focus search input when dialog opens
  React.useEffect(() => {
    if (open && searchInputRef.current) {
      // Small delay to ensure dialog is fully rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Clear search when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const handlePlaylistClick = (playlist: Playlist) => {
    onPlaylistSelect(playlist);
    onClose();
  };

  const handleCreateNew = () => {
    // If there's text in search, use it as the playlist name
    const playlistName = searchQuery.trim();
    if (playlistName) {
      onCreateNew(playlistName);
    } else {
      onCreateNew();
    }
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(d) => !d.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="md">
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={onClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch">
                {/* Search Bar */}
                <Box position="relative">
                  <Input
                    ref={searchInputRef}
                    placeholder="Search playlists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    pl={10}
                  />
                  <Box
                    position="absolute"
                    left={3}
                    top="50%"
                    transform="translateY(-50%)"
                    color="gray.400"
                  >
                    <FiSearch />
                  </Box>
                </Box>

                {/* Loading State */}
                {isLoading && (
                  <Box textAlign="center" py={4}>
                    <Spinner />
                    <Text mt={2} color="gray.500">
                      Loading playlists...
                    </Text>
                  </Box>
                )}

                {/* Error State */}
                {error && (
                  <Box textAlign="center" py={4}>
                    <Text color="red.500">Failed to load playlists</Text>
                  </Box>
                )}

                {/* Playlist List */}
                {!isLoading && !error && (
                  <VStack align="stretch" maxH="300px" overflowY="auto">
                    {filteredPlaylists.length === 0 ? (
                      <Box textAlign="center" py={4}>
                        {searchQuery.trim() ? (
                          <Text color="gray.500">
                            No playlists found matching ({searchQuery})
                          </Text>
                        ) : (
                          <Text color="gray.500">No playlists found</Text>
                        )}
                      </Box>
                    ) : (
                      filteredPlaylists.map((playlist: Playlist) => (
                        <Button
                          key={playlist.id}
                          variant="ghost"
                          onClick={() => handlePlaylistClick(playlist)}
                          justifyContent="flex-start"
                          p={3}
                          h="auto"
                        >
                          <VStack align="flex-start">
                            <Text fontWeight="medium">{playlist.name}</Text>
                            <Text fontSize="sm" color="gray.500">
                              {Array.isArray(playlist.tracks)
                                ? `${playlist.tracks.length} tracks`
                                : "0 tracks"}
                            </Text>
                          </VStack>
                        </Button>
                      ))
                    )}
                  </VStack>
                )}

                {/* Create New Playlist Button */}
                <Box borderTop="1px solid" borderColor="gray.200" pt={4}>
                  <Button
                    onClick={handleCreateNew}
                    variant="outline"
                    width="full"
                  >
                    <FiPlus />
                    {searchQuery.trim()
                      ? `Create "${searchQuery.trim()}"`
                      : "Create New Playlist"}
                  </Button>
                </Box>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
