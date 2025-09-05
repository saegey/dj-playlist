"use client";

import React, { useRef, useState } from "react";
import { Text, Spinner, HStack, Container, Box } from "@chakra-ui/react";
import UsernameSelect from "@/components/UsernameSelect";
import SingleTrackUI from "@/components/SingleTrackUI";
import { toaster, Toaster } from "@/components/ui/toaster";
import {
  MissingAppleProvider,
  useMissingApple,
} from "@/providers/MissingAppleContext";
import TrackEditDialog from "@/components/TrackEditDialog";
import { TrackEditFormProps } from "@/components/TrackEditForm";
import { useTracksQuery } from "@/hooks/useTracksQuery";

function MissingAudio() {
  const { usernames } = useMissingApple();
  const [dialogOpen, setDialogOpen] = useState(false);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const { total, loading, tracks, currentIndex } = useMissingApple();
  const { saveTrack } = useTracksQuery();

  const handleSaveTrack = async (data: TrackEditFormProps) => {
    try {
      await saveTrack(data);
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to update track", error);
      toaster.create({ title: "Failed to update track", type: "error" });
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

export default function MissingAudioPage() {
  return (
    <MissingAppleProvider>
      <MissingAudio />
      <Toaster />
    </MissingAppleProvider>
  );
}
