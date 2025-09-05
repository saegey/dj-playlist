"use client";

import React, { useRef, useState } from "react";
import { Text, Spinner, HStack, Container, Box } from "@chakra-ui/react";
import UsernameSelect from "@/components/UsernameSelect";
import SingleTrackUI from "@/components/SingleTrackUI";
import { Toaster } from "@/components/ui/toaster";
import {
  MissingAppleProvider,
  useMissingApple,
} from "@/providers/MissingAppleContext";
import TrackEditDialog from "@/components/TrackEditDialog";
import { TrackEditFormProps } from "@/components/TrackEditForm";

function MissingAppleInner() {
  const { usernames } = useMissingApple();
  const [dialogOpen, setDialogOpen] = useState(false);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const { total, loading, tracks, currentIndex } = useMissingApple();

  const handleSaveTrack = async (data: TrackEditFormProps) => {
    const res = await fetch("/api/tracks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setDialogOpen(false);
    } else {
      alert("Failed to update track");
    }
  };

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
          <SingleTrackUI setEditDialogOpen={setDialogOpen} />
        )}
      </Container>
      <TrackEditDialog
        editTrack={tracks[currentIndex]}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        initialFocusRef={initialFocusRef}
        onSave={handleSaveTrack}
      />
    </>
  );
}

export default function MissingAppleMusicPage() {
  return (
    <MissingAppleProvider>
      <MissingAppleInner />
      <Toaster />
    </MissingAppleProvider>
  );
}
