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
import type { YoutubeVideo } from "@/types/track";

type Props = {
  open: boolean;
  loading: boolean;
  results: YoutubeVideo[];
  onOpenChange: (open: boolean) => void;
  onSelect: (video: YoutubeVideo) => void;
};

export default function YouTubePickerDialog({
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
              <Dialog.Title>Select YouTube Video</Dialog.Title>
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
                  {results.map((video) => (
                    <Flex
                      key={video.id}
                      align="center"
                      gap={3}
                      borderWidth="1px"
                      borderRadius="md"
                      p={2}
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
                          <Text fontSize="sm">{video.channel}</Text>
                        )}
                      </Box>
                      <Button
                        colorScheme="red"
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
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
