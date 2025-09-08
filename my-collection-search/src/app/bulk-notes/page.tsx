"use client";

import React, { useState } from "react";
import { useFriendsQuery } from "@/hooks/useFriendsQuery";
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
  InputGroup,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useSearchResults } from "@/hooks/useSearchResults";
import { LuSearch } from "react-icons/lu";
import { FiCheck, FiCopy, FiUpload } from "react-icons/fi";
import { useUsername } from "@/providers/UsernameProvider";
import UsernameSelect from "@/components/UsernameSelect";
import { useBulkUpdateTrackNotesMutation } from "@/hooks/useBulkUpdateTrackNotesMutation";
import type { BulkNotesUpdate } from "@/services/trackService";
import { buildBulkTrackMetadataPrompt } from "@/lib/prompts";

export default function BulkNotesPage() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { friends: usernames, friendsLoading: usernamesLoading } =
    useFriendsQuery({ showCurrentUser: true, showSpotifyUsernames: true });
  const { username: selectedUsername } = useUsername();
  const [bulkJson, setBulkJson] = useState("");
  const [filterLocalTagsEmpty, setFilterLocalTagsEmpty] = useState(true);
  const [artistSearch, setArtistSearch] = useState("");
  const [isDataUploading, setIsDataUploading] = useState(false);
  const { mutateAsync: bulkUpdateNotes } = useBulkUpdateTrackNotesMutation();

  // Build filter string for MeiliSearch
  let filter = undefined;
  const localTagsFilter =
    "local_tags IS NULL OR local_tags IS EMPTY OR local_tags = '{}'";
  if (filterLocalTagsEmpty && selectedUsername) {
    filter = `(${localTagsFilter}) AND username = '${selectedUsername}'`;
  } else if (filterLocalTagsEmpty) {
    filter = localTagsFilter;
  } else if (selectedUsername) {
    filter = `username = '${selectedUsername}'`;
  }

  const {
    setQuery,
    results: tracks,
    loading,
  } = useSearchResults({
    filter,
  });

  React.useEffect(() => {
    if (artistSearch !== "") {
      setQuery(artistSearch);
    }
  }, [artistSearch, setQuery]);

  // Friends are loaded via useFriends hook

  // Toggle for filtering tracks with/without local_tags
  const handleToggleLocalTags = () => setFilterLocalTagsEmpty((v) => !v);

  const toggleSelect = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  const selectAll = () => setSelected(new Set(tracks.map((t) => t.id)));
  const deselectAll = () => setSelected(new Set());
  const selectFirst10 = () => {
    const first10Ids = tracks.slice(0, 10).map((t) => t.id);
    const allSelected = first10Ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        first10Ids.forEach((id) => next.delete(id));
      } else {
        first10Ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleGeneratePrompt = () => {
    const selectedTracks = tracks
      .filter((t) => selected.has(t.id))
      .map((t) => ({
        track_id: t.track_id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        url:
          t.discogs_url && t.discogs_url.trim() !== ""
            ? t.discogs_url
            : t.spotify_url,
      }));
    const fullPrompt = buildBulkTrackMetadataPrompt(selectedTracks);
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
    setIsDataUploading(true);
    let parsed: unknown;
    try {
      parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error();
    } catch {
      setIsDataUploading(false);
      toaster.create({ title: "Invalid JSON", type: "error" });
      return;
    }
    try {
      await bulkUpdateNotes(parsed as BulkNotesUpdate[]);
      toaster.create({ title: "Tracks updated", type: "success" });
    } catch (err) {
      console.error("Bulk update error", err);
      toaster.create({ title: "Update failed", type: "error" });
    } finally {
      setIsDataUploading(false);
    }
  };

  return (
    <>
      <Container>
        <SimpleGrid gap={2} columns={[1, 1, 4]} mt={3} mb={8}>
          <InputGroup startElement={<LuSearch size={16} />}>
            <Input
              placeholder="Search"
              value={artistSearch}
              onChange={(e) => setArtistSearch(e.target.value)}
              size="sm"
              variant="subtle"
              width="100%"
              mb={0}
            />
          </InputGroup>
          <Box display="flex" alignItems="center">
            <Checkbox.Root
              checked={filterLocalTagsEmpty}
              onCheckedChange={handleToggleLocalTags}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Text ml={2} fontSize="sm">
                Missing metadata
              </Text>
            </Checkbox.Root>
          </Box>

          <UsernameSelect
            usernames={usernames}
            isLoading={usernamesLoading}
            loadingText="Loading usernames..."
          />
          {/* Master checkbox will replace select all/deselect all buttons */}
          <Group grow>
            <Button onClick={selectFirst10} size="sm">
              <FiCheck />
              Select 10
            </Button>
            <Button
              onClick={handleGeneratePrompt}
              size="sm"
              disabled={!selected.size}
            >
              <FiCopy />
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
            showColumnBorder
            fontSize={["xs", "sm", "sm"]}
            maxH={"200px"}
          >
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader width={"5%"}>
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
                <Table.ColumnHeader width={"45%"}>Title</Table.ColumnHeader>
                <Table.ColumnHeader width={"25%"}>Artist</Table.ColumnHeader>
                <Table.ColumnHeader>Album</Table.ColumnHeader>
                {/* <Table.ColumnHeader>Discogs</Table.ColumnHeader> */}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {tracks.slice(0, 15).map((track) => (
                <Table.Row
                  key={track.id}
                  data-selected={selected.has(track.id) || undefined}
                >
                  <Table.Cell>
                    <Checkbox.Root
                      checked={selected.has(track.id)}
                      onCheckedChange={() => toggleSelect(track.id)}
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

        <Box
          position="fixed"
          bottom={"116px"}
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
              loading={isDataUploading}
            >
              <FiUpload />
              Upload Results
            </Button>
          </Container>
        </Box>
      </Container>
    </>
  );
}
