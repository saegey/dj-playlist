"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Input,
  Textarea,
  Text,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Image,
  Flex,
} from "@chakra-ui/react";
import { Track } from "@/app/page";

export default function TrackEditForm({
  track,
  onSave,
}: {
  track: Track;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    ...track,
    local_tags: track.local_tags || "",
    notes: track.notes || "",
    bpm: track.bpm || "",
    key: track.key || "",
  });
  const [fetching, setFetching] = useState(false);
  const [appleResults, setAppleResults] = useState<any[]>([]);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showAppleModal, setShowAppleModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch from ChatGPT
  const fetchFromChatGPT = async () => {
    setFetching(true);
    try {
      const prompt = `Given the following track details, suggest the musical key, BPM, genre or style of track, and a short DJ note.\nTitle: ${form.title}\nArtist: ${form.artist}\nAlbum: ${form.album}\n\nReturn JSON only like:\n{"key":"", "bpm":"", "notes":""}`;

      const res = await fetch("/api/ai/track-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({
          ...prev,
          key: data.key || prev.key,
          bpm: data.bpm || prev.bpm,
          notes: data.notes || prev.notes,
          local_tags: data.genre || prev.local_tags,
        }));
      } else {
        alert("Failed to fetch from AI");
      }
    } catch (err) {
      alert("Error fetching from AI");
    }
    setFetching(false);
  };

  // Apple Music search
  const searchAppleMusic = async () => {
    setAppleLoading(true);
    setShowAppleModal(true);
    setAppleResults([]);
    try {
      const res = await fetch("/api/ai/apple-music-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, artist: form.artist }),
      });
      if (res.ok) {
        const data = await res.json();
        setAppleResults(data.results || []);
      } else {
        alert("Apple Music search failed");
      }
    } catch (err) {
      alert("Apple Music search error");
    }
    setAppleLoading(false);
  };

  const handleAppleSelect = (song: any) => {
    setForm((prev) => ({
      ...prev,
      apple_music_url: song.url,
      duration_seconds: song.duration
        ? Math.round(song.duration / 1000)
        : undefined,
      apple_music_persistent_id: song.id
    }));
    setShowAppleModal(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      p={4}
      borderWidth="1px"
      borderRadius="md"
    >
      <Stack spacing={3}>
        <Text fontWeight="bold">Edit Track Metadata</Text>
        <Box>
          <Text mb={1} fontSize="sm">
            Title
          </Text>
          <Input
            name="title"
            value={form.title}
            onChange={handleChange}
          />
        </Box>
        <Box>
          <Text mb={1} fontSize="sm">
            Artist
          </Text>
          <Input
            name="artist"
            value={form.artist}
            onChange={handleChange}
          />
        </Box>
        <Box>
          <Text mb={1} fontSize="sm">
            Album
          </Text>
          <Input
            name="album"
            value={form.album}
            onChange={handleChange}
          />
        </Box>
        <Box>
          <Text mb={1} fontSize="sm">
            BPM
          </Text>
          <Input
            name="bpm"
            value={form.bpm}
            onChange={handleChange}
            type="number"
            min="0"
          />
        </Box>
        <Box>
          <Text mb={1} fontSize="sm">
            Key
          </Text>
          <Input name="key" value={form.key} onChange={handleChange} />
        </Box>
        <Box>
          <Text mb={1} fontSize="sm">
            Genre (comma separated)
          </Text>
          <Input
            name="local_tags"
            value={form.local_tags}
            onChange={handleChange}
          />
        </Box>
        <Box>
          <Text mb={1} fontSize="sm">
            Notes
          </Text>
          <Textarea name="notes" value={form.notes} onChange={handleChange} />
        </Box>
        <Box>
          <Text mb={1} fontSize="sm">
            Apple Music URL
          </Text>
          <Input
            name="apple_music_url"
            value={form.apple_music_url || ""}
            placeholder="Apple Music URL will appear here"
            onChange={handleChange}
          />
        </Box>
        <Flex gap={2}>
          <Button
            type="button"
            colorScheme="purple"
            isLoading={fetching}
            onClick={fetchFromChatGPT}
          >
            Fetch from AI
          </Button>
          <Button
            type="button"
            colorScheme="red"
            isLoading={appleLoading}
            onClick={searchAppleMusic}
          >
            Search Apple Music
          </Button>
        </Flex>

        <Modal
          isOpen={showAppleModal}
          onClose={() => setShowAppleModal(false)}
          isCentered
          size="xl"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Select Apple Music Track</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {appleLoading ? (
                <Text>Loading...</Text>
              ) : appleResults.length === 0 ? (
                <Text>No results found.</Text>
              ) : (
                <Stack spacing={3}>
                  {appleResults.map((song) => (
                    <Flex
                      key={song.id}
                      align="center"
                      gap={3}
                      borderWidth="1px"
                      borderRadius="md"
                      p={2}
                      _hover={{ bg: "gray.50", cursor: "pointer" }}
                      onClick={() => handleAppleSelect(song)}
                    >
                      {song.artwork && (
                        <Image
                          src={song.artwork.replace("{w}x{h}bb", "60x60bb")}
                          alt={song.title}
                          boxSize="60px"
                          borderRadius="md"
                        />
                      )}
                      <Box flex={1}>
                        <Text fontWeight="bold">{song.title}</Text>
                        <Text fontSize="sm">
                          {song.artist} — {song.album}
                        </Text>
                        <Text fontSize="sm" color="blue.600" isTruncated>
                          {song.url.length > 20
                            ? song.url.slice(0, 20) + "…"
                            : song.url}
                        </Text>
                      </Box>
                      <Button
                        colorScheme="blue"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAppleSelect(song);
                        }}
                      >
                        Select
                      </Button>
                    </Flex>
                  ))}
                </Stack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        <Button type="submit" colorScheme="blue" isLoading={loading}>
          Save
        </Button>
      </Stack>
    </Box>
  );
}
