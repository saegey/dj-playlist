"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Text,
  HStack,
  Textarea,
  Input,
  Portal,
  createListCollection,
  Select,
  Table,
  Checkbox,
} from "@chakra-ui/react";
import { toaster, Toaster } from "@/components/ui/toaster";
import { Track } from "../../types/track";
import TopMenuBar from "@/components/MenuBar";

export default function BulkNotesPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artistSearch, setArtistSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [usernames, setUsernames] = useState<string[]>([]);
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [bulkPrompt, setBulkPrompt] = useState("");
  const [bulkJson, setBulkJson] = useState("");

  useEffect(() => {
    fetch("/api/tracks/usernames")
      .then((r) => r.json())
      .then((data) =>
        setUsernames(Array.isArray(data) ? data : data.usernames || [])
      );
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = artistSearch.trim()
      ? `/api/tracks/bulk-notes-search?artist=${encodeURIComponent(
          artistSearch
        )}`
      : "/api/tracks/bulk-notes";
    if (selectedUsername)
      url +=
        (url.includes("?") ? "&" : "?") +
        `username=${encodeURIComponent(selectedUsername)}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setTracks(data.tracks || []))
      .finally(() => setLoading(false));
  }, [selectedUsername, artistSearch]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  const selectAll = () => setSelected(new Set(tracks.map((t) => t.track_id)));
  const deselectAll = () => setSelected(new Set());
  const selectFirst10 = () =>
    setSelected(new Set(tracks.slice(0, 10).map((t) => t.track_id)));

  const handleGeneratePrompt = () => {
    const promptTracks = tracks
      .filter((t) => selected.has(t.track_id))
      .map(
        (t) =>
          `Track ID: ${t.track_id}\nTitle: ${t.title}\nArtist: ${t.artist}\nAlbum: ${t.album}\nDiscogs URL: ${t.discogs_url}\n---`
      )
      .join("\n");
    const fullPrompt = `You are a DJ music metadata assistant. For each track below, return a JSON object... Tracks:\n${promptTracks}`;
    setBulkPrompt(fullPrompt);
    navigator.clipboard.writeText(fullPrompt);
    toaster.create({ title: "Prompt copied", type: "success" });
  };

  const handleUpload = async () => {
    let parsed;
    try {
      parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error();
    } catch {
      toaster.create({ title: "Invalid JSON", type: "error" });
      return;
    }
    setLoading(true);
    const res = await fetch("/api/tracks/bulk-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: parsed }),
    });
    setLoading(false);
    toaster.create({
      title: res.ok ? "Tracks updated" : "Update failed",
      type: res.ok ? "success" : "error",
    });
  };

  const userCollection = createListCollection({
    items: usernames.map((u) => ({ label: u, value: u })),
  });

  return (
    <>
      <Toaster />
      <TopMenuBar current="/bulk-notes" />
      <Box p={6} pb={80}>
        <HStack gap={2} mb={4}>
          <Box>
            <Input
              placeholder="Search by artist..."
              value={artistSearch}
              onChange={(e) => setArtistSearch(e.target.value)}
              size="sm"
              maxW="320px"
              width="300px"
              mb={0}
            />
          </Box>
          <Select.Root
            collection={userCollection}
            value={selectedUsername ? [selectedUsername] : []}
            onValueChange={(v) => setSelectedUsername(v.value[0] || "")}
            width="160px"
            size={"sm"}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="All Users" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {usernames.map((u) => (
                    <Select.Item key={u} item={{ label: u, value: u }}>
                      {u}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
          <Button onClick={selectAll} size="sm">
            Select All
          </Button>
          <Button onClick={selectFirst10} size="sm">
            Select First 10
          </Button>
          <Button onClick={deselectAll} size="sm">
            Deselect All
          </Button>
          <Button
            onClick={handleGeneratePrompt}
            size="sm"
            disabled={!selected.size}
          >
            Copy Prompt
          </Button>
        </HStack>

        {loading ? (
          <Text>Loading…</Text>
        ) : tracks.length === 0 ? (
          <Text color="gray.500">No tracks missing notes or genre.</Text>
        ) : (
          <Table.Root
            size="sm"
            variant="outline"
            striped
            showColumnBorder
            interactive
            mb={4}
          >
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader />
                <Table.ColumnHeader>Title</Table.ColumnHeader>
                <Table.ColumnHeader>Artist</Table.ColumnHeader>
                <Table.ColumnHeader>Album</Table.ColumnHeader>
                <Table.ColumnHeader>Discogs</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {tracks.map((track) => (
                <Table.Row
                  key={track.track_id}
                  data-selected={selected.has(track.track_id) ? "" : undefined}
                >
                  <Table.Cell>
                    <Checkbox.Root
                      checked={selected.has(track.track_id)}
                      onCheckedChange={() => toggleSelect(track.track_id)}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                    </Checkbox.Root>
                  </Table.Cell>
                  <Table.Cell>{track.title}</Table.Cell>
                  <Table.Cell>{track.artist}</Table.Cell>
                  <Table.Cell>{track.album}</Table.Cell>
                  <Table.Cell>
                    {track.discogs_url ? (
                      <a
                        href={track.discogs_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Discogs
                      </a>
                    ) : (
                      <Text>—</Text>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}

        <Box mb={4}>
          <Text fontWeight="bold">Bulk Prompt for ChatGPT</Text>
          <Textarea value={bulkPrompt} rows={10} readOnly fontSize="sm" />
        </Box>

        <Box
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg="bg.subtle"
          px={6}
          py={4}
          boxShadow="0 -2px 8px rgba(0,0,0,0.08)"
          zIndex={100}
        >
          <Text fontWeight="bold">Paste Bulk JSON Results</Text>
          <Textarea
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            rows={6}
            fontSize="sm"
            placeholder='[{"track_id":"123","genre":"House","notes":"..."}]'
            mb={2}
          />
          <Button colorPalette="blue" onClick={handleUpload} loading={loading}>
            Upload Results
          </Button>
        </Box>
      </Box>
    </>
  );
}
