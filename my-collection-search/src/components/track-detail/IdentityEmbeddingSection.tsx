"use client";

import { Badge, Box, Heading, HStack, Skeleton, Text, VStack } from "@chakra-ui/react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { IdentityEmbeddingPreviewResponse } from "@/services/internalApi/tracks";

type Props = {
  query: UseQueryResult<IdentityEmbeddingPreviewResponse, Error>;
};

export default function IdentityEmbeddingSection({ query }: Props) {
  return (
    <Box borderWidth="1px" borderRadius="md" p={4} mt={4}>
      <Heading size="sm" mb={3}>
        Identity Embedding Preview
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
            : "Failed to load identity embedding preview"}
        </Text>
      ) : query.data ? (
        <VStack align="stretch" gap={3}>
          <HStack gap={2} flexWrap="wrap">
            <Badge colorPalette="purple">Music Identity</Badge>
            <Badge variant="outline">{query.data.identityData.era}</Badge>
            <Badge variant="outline">{query.data.identityData.country}</Badge>
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
            bg="gray.50"
            _dark={{ bg: "gray.900" }}
          >
            {query.data.identityText}
          </Box>
          <Box fontSize="xs" color="fg.muted">
            <Text fontWeight="medium" mb={1}>
              Normalized Data:
            </Text>
            <Text>Genres: {query.data.identityData.genres.join(", ") || "none"}</Text>
            <Text>Styles: {query.data.identityData.styles.join(", ") || "none"}</Text>
            <Text>Tags: {query.data.identityData.tags.join(", ") || "none"}</Text>
            <Text>Labels: {query.data.identityData.labels.join(", ") || "none"}</Text>
          </Box>
        </VStack>
      ) : (
        <Text color="fg.muted">No identity embedding preview available.</Text>
      )}
    </Box>
  );
}
