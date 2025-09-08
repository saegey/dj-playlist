"use client";

import React from "react";
import { Box, Button, Flex, SimpleGrid, Skeleton, Spinner, Stack } from "@chakra-ui/react";

/**
 * TrackEditFormSkeleton
 * Lightweight placeholder UI shown while a track is loading into the editor.
 */
export default function TrackEditFormSkeleton() {
  return (
    <Stack gap={4}>
      <SimpleGrid columns={[2, 3]} gap={2}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Button key={i} variant="outline" size="sm" disabled>
            <Spinner size="xs" mr={2} /> Loading...
          </Button>
        ))}
      </SimpleGrid>
      <Stack borderWidth="1px" borderRadius="md" padding={4}>
        <Stack gap={2}>
          <Box>
            <Skeleton height="28px" width="60%" mb={2} />
            <Skeleton height="28px" width="70%" mb={2} />
            <Skeleton height="28px" width="65%" />
          </Box>
          <Flex gap={2}>
            <Skeleton height="38px" flex={1} />
            <Skeleton height="38px" flex={1} />
            <Skeleton height="38px" flex={1} />
            <Skeleton height="38px" flex={1} />
          </Flex>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height="38px" />
          ))}
          <Skeleton height="24px" width="96px" />
        </Stack>
      </Stack>
    </Stack>
  );
}
