"use client";

import React from "react";
import { Box, Grid, Image, Text, Button, Link } from "@chakra-ui/react";
import { formatSeconds } from "@/lib/trackUtils";

export interface AppleResultItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  url: string;
  artwork?: string;
  duration?: number; // ms
  link?: string; // Optional link to Apple Music
}

type Props = {
  result: AppleResultItem;
  onSave?: (url: string) => void | Promise<void>;
  saving?: boolean;
};

export default function AppleResultRow({ result, onSave, saving }: Props) {
  return (
    <Box borderWidth="1px" borderRadius="md" mt={2} mb={2} p={2}>
      <Grid templateColumns="80px 1fr auto" gap={3} alignItems="center">
        {result.artwork ? (
          <Image
            src={result.artwork.replace("{w}x{h}bb", "200x200bb")}
            alt={result.title}
            boxSize="80px"
            borderRadius="md"
          />
        ) : (
          <Box boxSize="80px" borderRadius="md" bg="gray.100" />
        )}
        <Box>
          <Text fontWeight="bold" fontSize="sm">
            {result.title}
          </Text>
          <Text fontSize="xs">{result.artist}</Text>
          <Text fontSize="xs" color="gray.500">
            {result.album}
          </Text>
          {typeof result.duration === "number" && (
            <Text fontSize="xs" color="gray.500">
              {formatSeconds(Math.round(result.duration / 1000))}
            </Text>
          )}
          {result.url && (
            <Link
              href={result.url}
              color="blue.500"
              fontSize="xs"
              target="blank"
            >
              {result.url}
            </Link>
          )}
        </Box>
        {onSave ? (
          <Button
            colorScheme="green"
            size="xs"
            onClick={() => onSave(result.url)}
            loading={!!saving}
          >
            Save URL
          </Button>
        ) : (
          <Box />
        )}
      </Grid>
    </Box>
  );
}
