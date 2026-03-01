"use client";

import { Badge, Box, Heading, HStack, Skeleton, Text, VStack } from "@chakra-ui/react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { TrackEmbeddingPreviewResponse } from "@/services/internalApi/tracks";

type Props = {
  query: UseQueryResult<TrackEmbeddingPreviewResponse, Error>;
};

export default function EmbeddingPreviewSection({ query }: Props) {
  return (
    <Box borderWidth="1px" borderRadius="md" p={4} mt={4}>
      <Heading size="sm" mb={3}>
        Embedding Preview (Original)
      </Heading>

      {query.isLoading ? (
        <VStack align="stretch" gap={2}>
          <Skeleton height="20px" />
          <Skeleton height="120px" />
        </VStack>
      ) : query.error ? (
        <Text color="red.500">
          {query.error instanceof Error
            ? query.error.message
            : "Failed to load embedding preview"}
        </Text>
      ) : query.data ? (
        <VStack align="stretch" gap={3}>
          <HStack gap={2} flexWrap="wrap">
            <Badge colorPalette={query.data.isDefaultTemplate ? "gray" : "green"}>
              {query.data.isDefaultTemplate ? "Default Template" : "Custom Template"}
            </Badge>
          </HStack>
          <Box
            as="pre"
            p={3}
            borderRadius="md"
            borderWidth="1px"
            overflow="auto"
            maxH="420px"
            fontSize="xs"
            whiteSpace="pre-wrap"
          >
            {query.data.prompt}
          </Box>
        </VStack>
      ) : (
        <Text color="fg.muted">No embedding preview available.</Text>
      )}
    </Box>
  );
}
