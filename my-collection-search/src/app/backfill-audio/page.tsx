"use client";

import React, { useEffect, useState } from "react";
import { Switch } from "@chakra-ui/react";
import { ActionBar, CloseButton } from "@chakra-ui/react";
import { LuLightbulb } from "react-icons/lu";
import { useFriends } from "@/hooks/useFriends";
import {
  Button,
  Checkbox,
  Spinner,
  Text,
  createListCollection,
  Select,
  Table, // v3 import
  Portal,
  Input,
  Container,
  SimpleGrid,
} from "@chakra-ui/react";
import { Track } from "../../types/track";
import TopMenuBar from "@/components/MenuBar";

interface BackfillTrack extends Track {
  status?: "pending" | "analyzing" | "success" | "error";
  errorMsg?: string;
}
export default function BackfillAudioPage() {
  const [tracks, setTracks] = useState<BackfillTrack[]>([]);
  const [showMissingAudio, setShowMissingAudio] = useState(true);
  const [showMissingVectors, setShowMissingVectors] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { friends: usernames } = useFriends();
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [artistSearch, setArtistSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Friends are loaded via useFriends hook

  useEffect(() => {
    setLoading(true);
    const fetchTracks = async () => {
      const { getMeiliClient } = await import("@/lib/meili");
      const meiliClient = getMeiliClient();
      const index = meiliClient.index("tracks");
      const filter = [];
      if (selectedUsername) filter.push(`username = '${selectedUsername}'`);
      // if (artistSearch.trim()) filter.push(`artist = '${artistSearch.trim()}'`);
      if (showMissingAudio) {
        filter.push("local_audio_url IS NULL");
      } else {
        filter.push("local_audio_url IS NOT NULL");
      }
      if (showMissingVectors) {
        filter.push("hasVectors = false");
      } else {
        filter.push("hasVectors = true");
      }
      const results = await index.search("", {
        q: artistSearch.trim(),
        filter: filter.join(" AND "),
        limit: 1000,
      });
      setTracks((results.hits as BackfillTrack[]) || []);
      setSelected(new Set());
      setLoading(false);
    };
    fetchTracks();
  }, [selectedUsername, artistSearch, showMissingAudio, showMissingVectors]);

  const toggleSelect = (trackId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(tracks.map((t) => t.track_id)));
  const deselectAll = () => setSelected(new Set());

  const handleVectorizeSelected = async () => {
    setAnalyzing(true);
    const updated = [...tracks];
    for (const trackId of selected) {
      const idx = updated.findIndex((t) => t.track_id === trackId);
      if (idx === -1) continue;
      updated[idx].status = "analyzing";
      setTracks([...updated]);
      try {
        const res = await fetch("/api/tracks/vectorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            track_id: updated[idx].track_id,
            // add other fields if needed
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        updated[idx].status = "success";
      } catch (err) {
        updated[idx].status = "error";
        updated[idx].errorMsg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message)
            : "Unknown error";
      }
      setTracks([...updated]);
    }
    setAnalyzing(false);
  };

  const usernameCollection = createListCollection({
    items: usernames.map((u) => ({ label: u, value: u })),
  });

  return (
    <>
      <TopMenuBar current="/backfill-audio" />
      <Container>
        <SimpleGrid columns={[1, null, 5]} gap={4} mb={4}>
          <Input
            type="text"
            placeholder="Search"
            value={artistSearch}
            onChange={(e) => setArtistSearch(e.target.value)}
            disabled={analyzing}
            size={["sm", "md", "md"]}
            variant={"subtle"}
          />
          <Switch.Root
            checked={showMissingAudio}
            onCheckedChange={(e) => setShowMissingAudio(e.checked)}
          >
            <Switch.Label>Missing Audio</Switch.Label>
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label />
          </Switch.Root>
          <Switch.Root
            checked={showMissingVectors}
            onCheckedChange={(e) => setShowMissingVectors(e.checked)}
          >
            <Switch.Label>Missing Vectors</Switch.Label>
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label />
          </Switch.Root>
          <Select.Root
            collection={usernameCollection}
            value={selectedUsername ? [selectedUsername] : []}
            onValueChange={(vals) => setSelectedUsername(vals.value[0] || "")}
            width="100%"
            size={["sm", "md", "md"]}
            variant={"subtle"}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Choose user library" />
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

          {/* Master checkbox will replace these buttons */}
          <Button
            onClick={handleVectorizeSelected}
            disabled={!selected.size || analyzing}
            loading={analyzing}
            size={["sm", "md", "md"]}
          >
            Vectorize
          </Button>
        </SimpleGrid>

        {loading ? (
          <Spinner />
        ) : tracks.length === 0 ? (
          <Text color="gray.500">No tracks to backfill.</Text>
        ) : (
          <Table.Root
            size="sm"
            variant="outline"
            striped
            showColumnBorder
            interactive
            fontSize={["xs", "sm", "sm"]}
          >
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>
                  <Checkbox.Root
                    checked={
                      selected.size === tracks.length && tracks.length > 0
                    }
                    // _indeterminate={selected.size > 0 && selected.size < tracks.length}
                    onChange={() => {
                      if (selected.size === tracks.length) {
                        deselectAll();
                      } else {
                        selectAll();
                      }
                    }}
                    disabled={analyzing || tracks.length === 0}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
                <Table.ColumnHeader>Title</Table.ColumnHeader>
                <Table.ColumnHeader>Artist</Table.ColumnHeader>
                <Table.ColumnHeader>Source</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
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
                      onChange={() => toggleSelect(track.track_id)}
                      disabled={analyzing}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                    </Checkbox.Root>
                  </Table.Cell>
                  <Table.Cell>{track.title}</Table.Cell>
                  <Table.Cell>{track.artist}</Table.Cell>
                  <Table.Cell>
                    {track.apple_music_url ? (
                      <a
                        href={track.apple_music_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Apple
                      </a>
                    ) : track.youtube_url ? (
                      <a
                        href={track.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Youtube
                      </a>
                    ) : track.soundcloud_url ? (
                      <a
                        href={track.soundcloud_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        SoundCloud
                      </a>
                    ) : (
                      <Text color="gray.400">—</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {track.status === "analyzing" ? (
                      <Spinner size="xs" />
                    ) : track.status === "success" ? (
                      <Text color="green.500">✓</Text>
                    ) : track.status === "error" ? (
                      <Text color="red.500">{track.errorMsg || "Error"}</Text>
                    ) : (
                      <Text color="gray.400">—</Text>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
        {/* ActionBar appears when items are selected */}
        <ActionBar.Root
          open={selected.size > 0}
          onOpenChange={(e) => {
            if (!e.open) deselectAll();
          }}
          closeOnInteractOutside={false}
        >
          <Portal>
            <ActionBar.Positioner>
              <ActionBar.Content>
                <ActionBar.SelectionTrigger>
                  {selected.size} selected
                </ActionBar.SelectionTrigger>
                <ActionBar.Separator />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVectorizeSelected}
                  disabled={!selected.size || analyzing}
                >
                  <LuLightbulb style={{ marginRight: 4 }} />
                  Vectorize
                </Button>
                <ActionBar.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </ActionBar.CloseTrigger>
              </ActionBar.Content>
            </ActionBar.Positioner>
          </Portal>
        </ActionBar.Root>
      </Container>
    </>
  );
}
