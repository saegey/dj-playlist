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
  const { isPending: aiAppleLoading, data } = useAppleMusicAISearchQuery(
    { title: track.title, artist: track.artist },
    true
  );

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
              {aiAppleLoading ? (
                <Text>Loading...</Text>
              ) : data?.results.length === 0 ? (
                <Text>No results found.</Text>
              ) : (
                <Stack>
                  {data?.results.map((song) => (
                    <Flex
                      key={song.id}
                      align="center"
                      gap={3}
                      borderWidth="1px"
                      borderRadius="md"
                      p={2}
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
                        <Text fontSize="sm">
                          {song.artist} — {song.album}
                        </Text>
                      </Box>
                      <Button
                        colorScheme="blue"
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
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
