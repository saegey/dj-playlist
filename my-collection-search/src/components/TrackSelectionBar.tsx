"use client";
import React from "react";
import { Box, Flex, Text, Button } from "@chakra-ui/react";

interface TrackSelectionBarProps {
  selectedCount: number;
  loadedCount: number;
  downloadableCount: number;
  onSelectAll: () => void;
  onClear: () => void;
  onEnrich: () => void;
  onDownloadAudio: () => void;
}

export default function TrackSelectionBar({
  selectedCount,
  loadedCount,
  downloadableCount,
  onSelectAll,
  onClear,
  onEnrich,
  onDownloadAudio,
}: TrackSelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="bg"
      borderTopWidth="1px"
      py={3}
      px={4}
      zIndex={100}
      shadow="lg"
    >
      <Flex align="center" justify="space-between" maxW="4xl" mx="auto">
        <Flex align="center" gap={4}>
          <Text fontWeight="semibold" fontSize="sm">
            {selectedCount} track{selectedCount !== 1 ? "s" : ""} selected
          </Text>
          {selectedCount < loadedCount && (
            <Button size="xs" variant="ghost" onClick={onSelectAll}>
              Select all {loadedCount} loaded
            </Button>
          )}
          <Button size="xs" variant="ghost" colorPalette="red" onClick={onClear}>
            Clear
          </Button>
        </Flex>
        <Flex gap={2}>
          {downloadableCount > 0 && (
            <Button size="sm" variant="outline" onClick={onDownloadAudio}>
              Download audio ({downloadableCount})
            </Button>
          )}
          <Button size="sm" colorPalette="blue" onClick={onEnrich}>
            Enrich {selectedCount} track{selectedCount !== 1 ? "s" : ""} →
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
