"use client";

import React from "react";
import { Box, Button, CloseButton, Dialog, Flex, Image, Portal, Stack, Text } from "@chakra-ui/react";
import type { AppleMusicResult } from "@/types/track";

type Props = {
  open: boolean;
  loading: boolean;
  results: AppleMusicResult[];
  onOpenChange: (open: boolean) => void;
  onSelect: (song: AppleMusicResult) => void;
};

export default function AppleMusicPickerDialog({ open, loading, results, onOpenChange, onSelect }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(d) => onOpenChange(d.open)} size={["full", "lg", "lg"]}>
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
              {loading ? (
                <Text>Loading...</Text>
              ) : results.length === 0 ? (
                <Text>No results found.</Text>
              ) : (
                <Stack>
                  {results.map((song) => (
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
