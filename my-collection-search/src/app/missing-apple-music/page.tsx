"use client";

import { useEffect, useState } from "react";
import { Box, Flex, Text, Button, Spinner, useDisclosure } from "@chakra-ui/react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/modal";
import TrackResult from "../../components/TrackResult";
import dynamic from "next/dynamic";

const TrackEditForm = dynamic(() => import("../../components/TrackEditForm"), {
  ssr: false,
});

export default function MissingAppleMusicPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editTrack, setEditTrack] = useState<any | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      const res = await fetch("/api/tracks/missing-apple-music");
      if (res.ok) {
        const data = await res.json();
        // Support both old and new API shape for safety
        if (Array.isArray(data)) {
          setTracks(data);
          setTotal(data.length);
        } else if (data && Array.isArray(data.tracks)) {
          setTracks(data.tracks);
          setTotal(typeof data.total === 'number' ? data.total : data.tracks.length);
        } else {
          setTracks([]);
          setTotal(0);
        }
      }
      setLoading(false);
    };
    fetchTracks();
  }, []);

  const handleEditClick = (track: any) => {
    setEditTrack(track);
    onOpen();
  };
  const handleSaveTrack = async (data: any) => {
    // PATCH to update endpoint
    const res = await fetch("/api/tracks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setTracks((prev) => prev.map((t) => (t.track_id === data.track_id ? { ...t, ...data } : t)));
      setEditTrack(null);
      onClose();
    } else {
      alert("Failed to update track");
    }
  };

  return (
    <Box p={6}>
      <Text fontSize="2xl" fontWeight="bold" mb={2}>
        Tracks Missing Apple Music URL
      </Text>
      {typeof total === 'number' && (
        <Text fontSize="md" color="gray.600" mb={4}>
          {total} track{total === 1 ? '' : 's'} missing Apple Music URL
        </Text>
      )}
      {loading ? (
        <Spinner />
      ) : tracks.length === 0 ? (
        <Text color="gray.500">All tracks have Apple Music URLs!</Text>
      ) : (
        <Box>
          {tracks.map((track) => (
            <TrackResult
              key={track.track_id}
              track={track}
              buttons={
                <Button colorScheme="blue" size="sm" onClick={() => handleEditClick(track)}>
                  Edit
                </Button>
              }
              allowMinimize={false} // Disable minimize for this view
            />
          ))}
        </Box>
      )}
      <Modal isOpen={!!editTrack && isOpen} onClose={() => { setEditTrack(null); onClose(); }} isCentered size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Track</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editTrack && (
              <TrackEditForm track={editTrack} onSave={handleSaveTrack} />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
