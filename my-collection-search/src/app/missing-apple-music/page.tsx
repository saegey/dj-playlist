"use client";

import React from "react";
import { Text, Spinner, HStack, Container } from "@chakra-ui/react";
import TopMenuBar from "@/components/MenuBar";
import UsernameSelect from "@/components/UsernameSelect";
import SingleTrackUI from "@/components/SingleTrackUI";
import { MissingAppleProvider, useMissingApple } from "@/providers/MissingAppleContext";

function MissingAppleInner() {
  const { usernames } = useMissingApple();
  const { total, loading, tracks } = useMissingApple();
  return (
    <>
      <TopMenuBar current="/missing-apple-music" />
      <Container maxW={["8xl", "2xl", "2xl"]}>
        <HStack mb={4} align="flex-end">
          <UsernameSelect usernames={usernames} />
        </HStack>
        {typeof total === "number" && (
          <Text fontSize="md" color="gray.600" mb={4}>
            {total} track{total === 1 ? "" : "s"} missing a music URL (Apple Music, SoundCloud, YouTube)
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

export default function MissingAppleMusicPage() {
  return (
    <MissingAppleProvider>
      <MissingAppleInner />
    </MissingAppleProvider>
  );
}
