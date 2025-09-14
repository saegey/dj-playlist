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
} from "@chakra-ui/react";
import type { SpotifySearchTrack } from "@/hooks/useSpotifyPicker";

type Props = {
  open: boolean;
  loading: boolean;
  results: SpotifySearchTrack[];
  onOpenChange: (open: boolean) => void;
  onSelect: (track: SpotifySearchTrack) => void;
};

export default function SpotifyPickerDialog({
  open,
  loading,
  results,
  onOpenChange,
  onSelect,
}: Props) {
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
              <Dialog.Title>Select Spotify Track</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              {loading ? (
                <Text>Loading...</Text>
              ) : results.length === 0 ? (
                <Text>No results found.</Text>
              ) : (
                <Stack>
                  {results.map((track) => (
                    <Flex
                      key={track.id}
                      align="center"
                      gap={3}
                      borderWidth="1px"
                      borderRadius="md"
                      p={2}
                      onClick={() => onSelect(track)}
                    >
                      {track.artwork && (
                        <Image
                          src={track.artwork}
                          alt={track.title}
                          boxSize="60px"
                          borderRadius="md"
                        />
                      )}
                      <Box flex="1">
                        <Text fontWeight="bold">{track.title}</Text>
                        <Text fontSize="sm">
                          {track.artist} — {track.album}
                        </Text>
                      </Box>
                      <Button
                        colorScheme="green"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(track);
                        }}
                      >
                        Select
                      </Button>
                    </Flex>
                  ))}
                </Stack>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
