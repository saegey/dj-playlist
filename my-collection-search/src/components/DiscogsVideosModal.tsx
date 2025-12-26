"use client";

import React from "react";
import {
  Dialog,
  Portal,
  CloseButton,
  Box,
  Text,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import { DiscogsVideo } from "@/services/discogsApiClient";
import AppleResultRow from "@/components/AppleResultRow";

interface DiscogsVideosModalProps {
  open: boolean;
  onClose: () => void;
  videos: DiscogsVideo[] | null;
  loading: boolean;
  trackTitle: string;
  trackArtist: string;
  trackAlbum?: string;
  onVideoSelect?: (url: string) => void;
}

export default function DiscogsVideosModal({
  open,
  onClose,
  videos,
  loading,
  trackTitle,
  trackArtist,
  trackAlbum,
  onVideoSelect,
}: DiscogsVideosModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(e: { open: boolean }) => !e.open && onClose()} size={["full", "lg", "lg"]}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Discogs Videos</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={onClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              {loading ? (
                <Flex justify="center" py={8}>
                  <Spinner size="lg" />
                  <Text ml={3}>Loading Discogs videos...</Text>
                </Flex>
              ) : videos === null ? (
                <Box py={4}>
                  <Text color="gray.500">Click "Search Discogs" to load videos</Text>
                </Box>
              ) : videos.length === 0 ? (
                <Box py={4}>
                  <Text color="gray.500">No videos found on Discogs for this release</Text>
                </Box>
              ) : (
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    {videos.length} video{videos.length !== 1 ? "s" : ""} found
                  </Text>
                  {videos.map((video, i) => (
                    <AppleResultRow
                      key={i}
                      result={{
                        id: String(i),
                        title: video.title || trackTitle,
                        artist: trackArtist,
                        album: trackAlbum,
                        url: video.uri ?? "#",
                        artwork: undefined,
                        duration: video.duration ? video.duration * 1000 : undefined, // Convert seconds to ms
                      }}
                      onSave={
                        onVideoSelect
                          ? (url: string) => {
                              if (url) onVideoSelect(url);
                            }
                          : undefined
                      }
                    />
                  ))}
                </Box>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              {/* Footer could have actions if needed */}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
