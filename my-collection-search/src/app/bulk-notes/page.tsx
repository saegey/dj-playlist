"use client";

import React, { useEffect, useState } from "react";
import { useFriends } from "@/hooks/useFriends";
import {
  Box,
  Button,
  Text,
  Textarea,
  Input,
  Table,
  Checkbox,
  SimpleGrid,
  Group,
  Container,
} from "@chakra-ui/react";
import { useUsernameSelect } from "@/hooks/useUsernameSelect";
import { toaster, Toaster } from "@/components/ui/toaster";
import { Track } from "../../types/track";
import TopMenuBar from "@/components/MenuBar";
import { useSelectedUsername } from "@/hooks/useSelectedUsername";

export default function BulkNotesPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artistSearch, setArtistSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { friends: usernames } = useFriends();
  const [selectedUsername, setSelectedUsername] = useSelectedUsername();
  const [loading, setLoading] = useState(false);
  const [bulkPrompt, setBulkPrompt] = useState("");
  const [bulkJson, setBulkJson] = useState("");

  // Friends are loaded via useFriends hook

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
    const fullPrompt = `You are a DJ music metadata assistant. For each track below, return a JSON object with the following fields: track_id, local tags, notes.
Example:
{"track_id":"123","local_tags":"House","notes":"Great for warmup sets, uplifting vibe."}. In "notes", include a longer DJ-focused description with vibe, energy, suggested set placement, transition tips, and any emotional or cultural context. In local_tags, it is the genre or style of the actual track and not the album. 
 Tracks:\n${promptTracks}`;
    setBulkPrompt(fullPrompt);
    // Robust clipboard copy with fallback
    const copyToClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toaster.create({ title: "Prompt copied", type: "success" });
      } catch (err) {
        console.error("Failed to copy prompt", err);
        // Fallback: create a textarea, select, and copy
        try {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "absolute";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          toaster.create({
            title: "Prompt copied (fallback)",
            type: "success",
          });
        } catch (fallbackErr) {
          console.error("Failed to copy prompt with text area", fallbackErr);
          toaster.create({ title: "Failed to copy prompt", type: "error" });
        }
      }
    };
    copyToClipboard(fullPrompt);
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

  const UsernameSelect = useUsernameSelect({
    usernames,
    selectedUsername,
    setSelectedUsername,
    size: ["sm"],
    variant: "subtle",
    width: "100%",
  });

  return (
    <>
      <Toaster />
      <TopMenuBar current="/bulk-notes" />
      <Container>
        <SimpleGrid gap={2} mb={4} columns={[1, 1, 3]}>
          <Box>
            <Input
              placeholder="Search by artist..."
              value={artistSearch}
              onChange={(e) => setArtistSearch(e.target.value)}
              size="sm"
              variant="subtle"
              width="100%"
              mb={0}
            />
          </Box>
          {UsernameSelect}
          {/* Master checkbox will replace select all/deselect all buttons */}
          <Group grow>
            <Button onClick={selectFirst10} size="sm">
              Select First 10
            </Button>
            <Button
              onClick={handleGeneratePrompt}
              size="sm"
              disabled={!selected.size}
            >
              Copy Prompt
            </Button>
          </Group>
        </SimpleGrid>

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
            fontSize={["xs", "sm", "sm"]}
          >
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>
                  <Checkbox.Root
                    checked={
                      selected.size === tracks.length && tracks.length > 0
                    }
                    onCheckedChange={() => {
                      if (selected.size === tracks.length) {
                        deselectAll();
                      } else {
                        selectAll();
                      }
                    }}
                    disabled={tracks.length === 0}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
                <Table.ColumnHeader>Title</Table.ColumnHeader>
                <Table.ColumnHeader>Artist</Table.ColumnHeader>
                <Table.ColumnHeader>Album</Table.ColumnHeader>
                {/* <Table.ColumnHeader>Discogs</Table.ColumnHeader> */}
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
          <Container>
            <Text fontWeight="bold">Paste Bulk JSON Results</Text>
            <Textarea
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              rows={6}
              fontSize="sm"
              placeholder='[{"track_id":"123","genre":"House","notes":"..."}]'
              mb={2}
            />
            <Button
              colorPalette="blue"
              onClick={handleUpload}
              loading={loading}
            >
              Upload Results
            </Button>
          </Container>
        </Box>
      </Container>
    </>
  );
}
