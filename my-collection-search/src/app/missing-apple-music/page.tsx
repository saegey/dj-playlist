"use client";

import React from "react";
import { Text, Spinner, HStack, Box } from "@chakra-ui/react";

import UsernameSelect from "@/components/UsernameSelect";
import SingleTrackUI from "@/components/SingleTrackUI";
import {
  MissingAppleProvider,
  useMissingApple,
} from "@/providers/MissingAppleContext";
import PageContainer from "@/components/layout/PageContainer";

function MissingAudio() {
  const { usernames: friends, total, loading, tracks } = useMissingApple();
   
  return (
    <>
      <PageContainer size="standard" py={3} mb={8}>
        <HStack mb={4}>
          <Box>
            <Text fontSize="xs" mb={2}>
              Selected Library:
            </Text>
            <UsernameSelect
              usernames={friends}
              width="200px"
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
      </PageContainer>
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
