"use client";

import React, { useEffect, useState } from "react";
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { friends: usernames } = useFriends();
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [artistSearch, setArtistSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Friends are loaded via useFriends hook

  useEffect(() => {
    setLoading(true);
    const params = [];
    if (selectedUsername)
      params.push(`username=${encodeURIComponent(selectedUsername)}`);
    if (artistSearch.trim())
      params.push(`artist=${encodeURIComponent(artistSearch.trim())}`);
    const url =
      "/api/tracks/backfill-audio" +
      (params.length ? `?${params.join("&")}` : "");
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setTracks(data.tracks || []);
        setSelected(new Set());
      })
      .finally(() => setLoading(false));
  }, [selectedUsername, artistSearch]);

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

  const handleAnalyzeSelected = async () => {
    setAnalyzing(true);

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
            track_id: updated[idx].track_id,
            apple_music_url: updated[idx].apple_music_url,
            youtube_url: updated[idx].youtube_url,
            soundcloud_url: updated[idx].soundcloud_url,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        const data = await res.json();
        await fetch("/api/tracks/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            track_id: updated[idx].track_id,
            bpm: data.rhythm ? data.rhythm.bpm : undefined,
            key: data.tonal
              ? `${data.tonal.key_edma.key} ${data.tonal.key_edma.scale}`
              : undefined,
            danceability: data.rhythm ? data.rhythm.danceability : undefined,
            // mood_happy: data.mood_happy,
            // mood_sad: data.mood_sad,
            // mood_relaxed: data.mood_relaxed,
            // mood_aggressive: data.mood_aggressive,
          }),
        });
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
        <SimpleGrid columns={[1, null, 3]} gap={4} mb={4}>
          <Input
            type="text"
            placeholder="Search"
            value={artistSearch}
            onChange={(e) => setArtistSearch(e.target.value)}
            disabled={analyzing}
            size={["sm", "md", "md"]}
            variant={"subtle"}
          />
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
            onClick={handleAnalyzeSelected}
            disabled={!selected.size || analyzing}
            loading={analyzing}
            size={["sm", "md", "md"]}
          >
            Analyze
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
      </Container>
    </>
  );
}
