"use client";

import { useState } from "react";
import { Box, Button, Input, Textarea, Text, Stack } from "@chakra-ui/react";
import { useState as useReactState } from "react";
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
  const [fetching, setFetching] = useReactState(false);
  // Helper to fetch key, bpm, and notes from ChatGPT (mocked for now)
  const fetchFromChatGPT = async () => {
    setFetching(true);
    try {
      // Compose a prompt using track info
      const prompt = `Given the following track details, suggest the musical key, BPM, and a short DJ note.\nTitle: ${form.title}\nArtist: ${form.artist}\nAlbum: ${form.album}`;
      // Call your backend endpoint that talks to OpenAI/ChatGPT (replace with your actual endpoint)
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
          local_tags: data.local_tags || prev.local_tags,
        }));
      } else {
        alert("Failed to fetch from AI");
      }
    } catch (err) {
      alert("Error fetching from AI");
    }
    setFetching(false);
  };
  const [loading, setLoading] = useState(false);

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
          <Text mb={1} fontSize="sm">Title</Text>
          <Input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            isReadOnly
          />
        </Box>
        <Box>
          <Text mb={1} fontSize="sm">Artist</Text>
          <Input
            name="artist"
            value={form.artist}
            onChange={handleChange}
            placeholder="Artist"
            isReadOnly
          />
        </Box>
        <Box>
          <Text mb={1} fontSize="sm">Album</Text>
          <Input
            name="album"
            value={form.album}
            onChange={handleChange}
            placeholder="Album"
            isReadOnly
          />
        </Box>
        <Box>
          <Text mb={1} fontSize="sm">BPM</Text>
          <Input
            name="bpm"
            value={form.bpm}
            onChange={handleChange}
            placeholder="BPM"
            type="number"
            min="0"
          />
        </Box>
        <Box>
          <Text mb={1} fontSize="sm">Key</Text>
          <Input
            name="key"
            value={form.key}
            onChange={handleChange}
            placeholder="Key"
          />
        </Box>
        <Box>
          <Text mb={1} fontSize="sm">Genre (comma separated)</Text>
          <Input
            name="local_tags"
            value={form.local_tags}
            onChange={handleChange}
            placeholder="Genre (comma separated)"
          />
        </Box>
        <Box>
          <Text mb={1} fontSize="sm">Notes</Text>
          <Textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Notes"
          />
        </Box>
        <Button
          type="button"
          colorScheme="purple"
          isLoading={fetching}
          onClick={fetchFromChatGPT}
        >
          Fetch Key/BPM/Notes from AI
        </Button>
        <Button type="submit" colorScheme="blue" isLoading={loading}>
          Save
        </Button>
      </Stack>
    </Box>
  );
}
