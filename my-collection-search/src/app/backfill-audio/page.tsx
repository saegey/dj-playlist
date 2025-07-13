"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Spinner,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Select,
  Progress,
} from "@chakra-ui/react";
import { Track } from "../../types/track";

interface BackfillTrack extends Track {
  status?: "pending" | "analyzing" | "success" | "error";
  errorMsg?: string;
}

export default function BackfillAudioPage() {
  const [tracks, setTracks] = useState<BackfillTrack[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [usernames, setUsernames] = useState<string[]>([]);
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fetch usernames for filter
  useEffect(() => {
    fetch("/api/tracks/usernames")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsernames(data);
        else if (data && Array.isArray(data.usernames)) setUsernames(data.usernames);
      });
  }, []);

  // Fetch tracks to backfill
  useEffect(() => {
    setLoading(true);
    let url = "/api/tracks/backfill-audio";
    if (selectedUsername) url += `?username=${encodeURIComponent(selectedUsername)}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setTracks(data.tracks || []);
        setSelected(new Set());
        setLoading(false);
      });
  }, [selectedUsername]);

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

  // Analyze selected tracks one at a time
  const handleAnalyzeSelected = async () => {
    setAnalyzing(true);
    let done = 0;
    const total = selected.size;
    const updated = [...tracks];
    for (const trackId of selected) {
      const idx = updated.findIndex((t) => t.track_id === trackId);
      if (idx === -1) continue;
      updated[idx].status = "analyzing";
      setTracks([...updated]);
      try {
        const res = await fetch("/api/tracks/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apple_music_url: updated[idx].apple_music_url,
            youtube_url: updated[idx].youtube_url,
            soundcloud_url: updated[idx].soundcloud_url,
            track_id: updated[idx].track_id,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          // Save analysis to DB
          await fetch("/api/tracks/update", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              track_id: updated[idx].track_id,
              bpm: data.bpm,
              key: data.key ? `${data.key} ${data.scale}` : undefined,
              danceability: data.danceability,
              mood_happy: data.mood_happy,
              mood_sad: data.mood_sad,
              mood_relaxed: data.mood_relaxed,
              mood_aggressive: data.mood_aggressive,
              // Add more fields as needed
            }),
          });
          updated[idx].status = "success";
        } else {
          updated[idx].status = "error";
          updated[idx].errorMsg = (await res.json()).error || "Failed";
        }
      } catch (err: any) {
        updated[idx].status = "error";
        updated[idx].errorMsg = err.message || String(err);
      }
      done++;
      setProgress(Math.round((done / total) * 100));
      setTracks([...updated]);
    }
    setAnalyzing(false);
    setProgress(100);
  };

  return (
    <Box p={6}>
      <Text fontSize="2xl" fontWeight="bold" mb={4}>
        Backfill Audio Analysis
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
        <Button onClick={selectAll} size="sm">Select All</Button>
        <Button onClick={deselectAll} size="sm">Deselect All</Button>
        <Button
          colorScheme="teal"
          onClick={handleAnalyzeSelected}
          isDisabled={selected.size === 0 || analyzing}
          isLoading={analyzing}
        >
          Analyze Selected
        </Button>
        {analyzing && <Progress value={progress} w="120px" />}
      </HStack>
      {loading ? (
        <Spinner />
      ) : tracks.length === 0 ? (
        <Text color="gray.500">No tracks to backfill.</Text>
      ) : (
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th></Th>
              <Th>Title</Th>
              <Th>Artist</Th>
              <Th>Apple Music</Th>
              <Th>YouTube</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tracks.map((track) => (
              <Tr key={track.track_id}>
                <Td>
                  <Checkbox
                    isChecked={selected.has(track.track_id)}
                    onChange={() => toggleSelect(track.track_id)}
                    isDisabled={analyzing}
                  />
                </Td>
                <Td>{track.title}</Td>
                <Td>{track.artist}</Td>
                <Td>
                  {track.apple_music_url ? (
                    <a href={track.apple_music_url} target="_blank" rel="noopener noreferrer">Apple</a>
                  ) : (
                    <Text color="gray.400">—</Text>
                  )}
                </Td>
                <Td>
                  {track.youtube_url ? (
                    <a href={track.youtube_url} target="_blank" rel="noopener noreferrer">YouTube</a>
                  ) : (
                    <Text color="gray.400">—</Text>
                  )}
                </Td>
                <Td>
                  {track.status === "analyzing" ? (
                    <Spinner size="xs" />
                  ) : track.status === "success" ? (
                    <Text color="green.500">✓</Text>
                  ) : track.status === "error" ? (
                    <Text color="red.500">{track.errorMsg || "Error"}</Text>
                  ) : (
                    <Text color="gray.400">—</Text>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
}
