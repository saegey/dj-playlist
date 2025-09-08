"use client";

import React from "react";
import { Text, Spinner, HStack, Container, Box } from "@chakra-ui/react";

import UsernameSelect from "@/components/UsernameSelect";
import SingleTrackUI from "@/components/SingleTrackUI";
import {
  MissingAppleProvider,
  useMissingApple,
} from "@/providers/MissingAppleContext";

function MissingAudio() {
  const { usernames, total, loading, tracks } = useMissingApple();
   
  return (
    <>
      <Container maxW={["8xl", "2xl", "2xl"]} mt={3} mb={8}>
        <HStack mb={4}>
          <Box>
            <Text fontSize="xs" mb={2}>
              Selected Library:
            </Text>
            <UsernameSelect
              usernames={usernames}
              width="200px"
              variant="outline"
            />
          </Box>
        </HStack>
        {typeof total === "number" && (
          <Text fontSize="sm" color="gray.600" mb={4}>
            {total} track{total === 1 ? "" : "s"} missing a music URL
          </Text>
        )}
        {loading ? (
          <Spinner />
        ) : tracks.length === 0 ? (
          <Text color="gray.500">All tracks have Apple Music URLs!</Text>
        ) : (
          <SingleTrackUI />
        )}
      </Container>
    </>
  );
}

export default function MissingAudioPage() {
  return (
    <MissingAppleProvider>
      <MissingAudio />
    </MissingAppleProvider>
  );
}
