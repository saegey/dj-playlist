"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Select,
  Textarea,
  Input,
  useToast,
} from "@chakra-ui/react";
import { Track } from "../../types/track";

export default function BulkNotesPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [usernames, setUsernames] = useState<string[]>([]);
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [bulkPrompt, setBulkPrompt] = useState("");
  const [bulkJson, setBulkJson] = useState("");
  const toast = useToast();

  // Fetch usernames for filter
  useEffect(() => {
    fetch("/api/tracks/usernames")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsernames(data);
        else if (data && Array.isArray(data.usernames))
          setUsernames(data.usernames);
      });
  }, []);

  // Fetch tracks missing notes or local_tags
  useEffect(() => {
    setLoading(true);
    let url = "/api/tracks/bulk-notes";
    if (selectedUsername)
      url += `?username=${encodeURIComponent(selectedUsername)}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setTracks(data.tracks || []);
        setLoading(false);
      });
  }, [selectedUsername]);

  // Checkbox logic
  const toggleSelect = (trackId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  };
  const selectAll = () => {
    setSelected(new Set(tracks.map((t) => t.track_id)));
  };
  const deselectAll = () => {
    setSelected(new Set());
  };

  // Generate bulk prompt for selected
  const handleGeneratePrompt = () => {
    const prompt = tracks
      .filter((t) => selected.has(t.track_id))
      .map(
        (track) =>
          `Track ID: ${track.track_id}\nTitle: ${track.title}\nArtist: ${track.artist}\nAlbum: ${track.album}\nDiscogs URL: ${track.discogs_url}\n---`
      )
      .join("\n");
    setBulkPrompt(
      `You are a DJ music metadata assistant. For each track below, return a JSON object with the following fields: track_id, local tags, notes.\nExample:\n{"track_id":"123","local_tags":"House","notes":"Great for warmup sets, uplifting vibe."}. In \"notes\", include a longer DJ-focused description with vibe, energy, suggested set placement, transition tips, and any emotional or cultural context. In local_tags, it is the genre or style of the actual track and not the album. \nTracks:\n${prompt}`
    );
  };

  // Upload JSON results
  const handleUpload = async () => {
    let parsed: any[] = [];
    try {
      parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error("JSON must be an array");
    } catch (err) {
      toast({ status: "error", title: "Invalid JSON" });
      return;
    }
    setLoading(true);
    const res = await fetch("/api/tracks/bulk-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: parsed }),
    });
    setLoading(false);
    if (res.ok) {
      toast({ status: "success", title: "Tracks updated" });
    } else {
      toast({ status: "error", title: "Update failed" });
    }
  };

  return (
    <Box p={6}>
      <Text fontSize="2xl" fontWeight="bold" mb={4}>
        Bulk Notes/Genre Backfill
      </Text>
      <HStack mb={4}>
        <Select
          placeholder="All Users"
          value={selectedUsername}
          onChange={(e) => setSelectedUsername(e.target.value)}
          minW="160px"
        >
          {usernames.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </Select>
        <Button onClick={selectAll} size="sm">
          Select All
        </Button>
        <Button onClick={deselectAll} size="sm">
          Deselect All
        </Button>
        <Button onClick={handleGeneratePrompt} isDisabled={selected.size === 0}>
          Generate Bulk Prompt
        </Button>
      </HStack>
      {loading ? (
        <Text>Loading…</Text>
      ) : tracks.length === 0 ? (
        <Text color="gray.500">No tracks missing notes or genre.</Text>
      ) : (
        <Table size="sm" variant="simple" mb={4}>
          <Thead>
            <Tr>
              <Th></Th>
              <Th>Title</Th>
              <Th>Artist</Th>
              <Th>Album</Th>
              <Th>Discogs</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tracks.map((track) => (
              <Tr key={track.track_id}>
                <Td>
                  <input
                    type="checkbox"
                    checked={selected.has(track.track_id)}
                    onChange={() => toggleSelect(track.track_id)}
                  />
                </Td>
                <Td>{track.title}</Td>
                <Td>{track.artist}</Td>
                <Td>{track.album}</Td>
                <Td>
                  {track.discogs_url ? (
                    <a
                      href={track.discogs_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Discogs
                    </a>
                  ) : (
                    <Text color="gray.400">—</Text>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      <Box mb={4}>
        <Text fontWeight="bold" mb={1}>
          Bulk Prompt for ChatGPT
        </Text>
        <Textarea value={bulkPrompt} rows={10} readOnly fontSize="sm" />
      </Box>
      <Box mb={4}>
        <Text fontWeight="bold" mb={1}>
          Paste Bulk JSON Results
        </Text>
        <Textarea
          value={bulkJson}
          onChange={(e) => setBulkJson(e.target.value)}
          rows={10}
          fontSize="sm"
          placeholder='[
  {"track_id": "123", "genre": "House", "notes": "Great for warmup sets."},
  ...
]'
        />
        <Button
          mt={2}
          colorScheme="blue"
          onClick={handleUpload}
          isLoading={loading}
        >
          Upload Results
        </Button>
      </Box>
    </Box>
  );
}
