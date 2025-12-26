"use client";

import React from "react";
import {
  Dialog,
  Portal,
  CloseButton,
  Button,
  VStack,
  Checkbox,
  Text,
  Box,
} from "@chakra-ui/react";

export interface TracksFilter {
  missingAudio?: boolean;
  missingAppleMusic?: boolean;
  missingYouTube?: boolean;
  missingSpotify?: boolean;
  missingSoundCloud?: boolean;
  missingAnyStreamingUrl?: boolean;
  missingMetadata?: boolean;
}

interface TracksFilterModalProps {
  open: boolean;
  onClose: () => void;
  filters: TracksFilter;
  onFiltersChange: (filters: TracksFilter) => void;
  onApply: () => void;
  onClear: () => void;
}

export default function TracksFilterModal({
  open,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onClear,
}: TracksFilterModalProps) {
  const handleCheckboxChange = (key: keyof TracksFilter) => {
    onFiltersChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <Dialog.Root open={open} onOpenChange={(e: { open: boolean }) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Filter Tracks</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={onClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={3}>
                <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
                  Missing Data
                </Text>

                <Box pl={2}>
                  <VStack align="stretch" gap={2}>
                    <Checkbox.Root
                      checked={filters.missingAudio}
                      onChange={() => handleCheckboxChange("missingAudio")}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Text fontSize="sm" ml={2}>Missing local audio</Text>
                    </Checkbox.Root>

                    <Checkbox.Root
                      checked={filters.missingMetadata}
                      onChange={() => handleCheckboxChange("missingMetadata")}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Text fontSize="sm" ml={2}>Missing metadata (BPM or Key)</Text>
                    </Checkbox.Root>
                  </VStack>
                </Box>

                <Text fontSize="sm" fontWeight="semibold" color="fg.muted" mt={2}>
                  Missing Streaming URLs
                </Text>

                <Box pl={2}>
                  <VStack align="stretch" gap={2}>
                    <Checkbox.Root
                      checked={filters.missingAnyStreamingUrl}
                      onChange={() =>
                        handleCheckboxChange("missingAnyStreamingUrl")
                      }
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Text fontSize="sm" ml={2}>
                        Missing all streaming URLs (Apple/YouTube/Spotify/SoundCloud)
                      </Text>
                    </Checkbox.Root>

                    <Box pl={4} borderLeft="2px solid" borderColor="border.muted">
                      <VStack align="stretch" gap={2}>
                        <Checkbox.Root
                          checked={filters.missingAppleMusic}
                          onChange={() =>
                            handleCheckboxChange("missingAppleMusic")
                          }
                          disabled={filters.missingAnyStreamingUrl}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Text fontSize="sm" ml={2}>Missing Apple Music URL</Text>
                        </Checkbox.Root>

                        <Checkbox.Root
                          checked={filters.missingYouTube}
                          onChange={() => handleCheckboxChange("missingYouTube")}
                          disabled={filters.missingAnyStreamingUrl}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Text fontSize="sm" ml={2}>Missing YouTube URL</Text>
                        </Checkbox.Root>

                        <Checkbox.Root
                          checked={filters.missingSpotify}
                          onChange={() => handleCheckboxChange("missingSpotify")}
                          disabled={filters.missingAnyStreamingUrl}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Text fontSize="sm" ml={2}>Missing Spotify URL</Text>
                        </Checkbox.Root>

                        <Checkbox.Root
                          checked={filters.missingSoundCloud}
                          onChange={() =>
                            handleCheckboxChange("missingSoundCloud")
                          }
                          disabled={filters.missingAnyStreamingUrl}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Text fontSize="sm" ml={2}>Missing SoundCloud URL</Text>
                        </Checkbox.Root>
                      </VStack>
                    </Box>
                  </VStack>
                </Box>

                {activeFilterCount > 0 && (
                  <Text fontSize="xs" color="fg.muted" mt={2}>
                    {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}{" "}
                    active
                  </Text>
                )}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="ghost" onClick={onClear} disabled={activeFilterCount === 0}>
                Clear All
              </Button>
              <Button colorPalette="blue" onClick={onApply}>
                Apply Filters
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
