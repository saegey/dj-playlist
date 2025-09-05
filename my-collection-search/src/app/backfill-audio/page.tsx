"use client";

import React, { useEffect, useState } from "react";
import {
  Switch,
  ActionBar,
  CloseButton,
  Button,
  Checkbox,
  Spinner,
  Text,
  Portal,
  Input,
  Container,
  SimpleGrid,
  ButtonGroup,
  IconButton,
  Stack,
  Pagination,
  Table,
  InputGroup,
} from "@chakra-ui/react";

import {
  LuLightbulb,
  LuMusic,
  LuChevronLeft,
  LuChevronRight,
  LuSearch,
} from "react-icons/lu";
import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import { Track } from "../../types/track";
import TopMenuBar from "@/components/MenuBar";
import { useMeili } from "@/providers/MeiliProvider";
import UsernameSelect from "@/components/UsernameSelect";
import { useUsername } from "@/providers/UsernameProvider";

interface BackfillTrack extends Track {
  status?: "pending" | "analyzing" | "success" | "error";
  errorMsg?: string;
}

export default function BackfillAudioPage() {
  const [tracks, setTracks] = useState<BackfillTrack[]>([]);
  const [showMissingAudio, setShowMissingAudio] = useState(true);
  const [showMissingVectors, setShowMissingVectors] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { friends: usernames, friendsLoading: usernamesLoading } =
    useFriendsQuery({ showCurrentUser: true, showSpotifyUsernames: true });
  const { username: selectedUsername } = useUsername();
  const [artistSearch, setArtistSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const { client: meiliClient, ready } = useMeili();

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [selectedUsername, artistSearch, showMissingAudio, showMissingVectors]);

  useEffect(() => {
    setLoading(true);
    const fetchTracks = async () => {
      if (!ready || !meiliClient) return;
      const index = meiliClient.index("tracks");
      const filter = [];
      if (selectedUsername) filter.push(`username = '${selectedUsername}'`);
      if (showMissingAudio) {
        filter.push(
          "local_audio_url IS NULL AND (apple_music_url IS NOT NULL OR youtube_url IS NOT NULL OR soundcloud_url IS NOT NULL)"
        );
      } else {
        filter.push("local_audio_url IS NOT NULL");
      }
      if (showMissingVectors) {
        filter.push("hasVectors = false");
      } else {
        filter.push("hasVectors = true");
      }
      const offset = (page - 1) * pageSize;
      const results = await index.search("", {
        q: artistSearch.trim(),
        filter: filter.join(" AND "),
        limit: pageSize,
        offset,
      });
      setTracks((results.hits as BackfillTrack[]) || []);
      setTotal(results.estimatedTotalHits || 0);
      setSelected(new Set());
      setLoading(false);
    };
    fetchTracks();
  }, [
    selectedUsername,
    artistSearch,
    showMissingAudio,
    showMissingVectors,
    page,
    meiliClient,
    ready,
  ]);

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
            username: updated[idx].username,
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
            spotify_url: updated[idx].spotify_url,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        const data = await res.json();
        await fetch("/api/tracks/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: updated[idx].username,
            track_id: updated[idx].track_id,
            bpm:
              data.rhythm && typeof data.rhythm.bpm === "number"
                ? Math.round(data.rhythm.bpm)
                : undefined,
            key: data.tonal
              ? `${data.tonal.key_edma.key} ${data.tonal.key_edma.scale}`
              : undefined,
            danceability:
              data.rhythm && typeof data.rhythm.danceability === "number"
                ? Number(data.rhythm.danceability.toFixed(3))
                : undefined,
            duration_seconds: Math.round(data.metadata.audio_properties.length),
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

  return (
    <>
      <Container>
        {/* Pagination UI */}

        <SimpleGrid columns={[1, null, 5]} gap={4} mt={3} mb={8}>
          <InputGroup startElement={<LuSearch size={16} />}>
            <Input
              type="text"
              placeholder="Search"
              value={artistSearch}
              onChange={(e) => setArtistSearch(e.target.value)}
              disabled={analyzing}
              size={["sm", "md", "md"]}
              variant={"subtle"}
            />
          </InputGroup>
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
          <UsernameSelect
            usernames={usernames}
            isLoading={usernamesLoading}
            loadingText="Loading usernames..."
          />
        </SimpleGrid>

        {/* ActionBar appears when items are selected */}
        <ActionBar.Root
          open={selected.size > 0}
          onOpenChange={(e) => {
            if (!e.open) deselectAll();
          }}
          closeOnInteractOutside={false}
          portalled={false}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyzeSelected}
                  disabled={!selected.size || analyzing}
                >
                  <LuMusic style={{ marginRight: 4 }} />
                  Analyze Audio
                </Button>
                <ActionBar.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </ActionBar.CloseTrigger>
              </ActionBar.Content>
            </ActionBar.Positioner>
          </Portal>
        </ActionBar.Root>

        {loading ? (
          <Spinner />
        ) : tracks.length === 0 ? (
          <Text color="gray.500">No tracks to backfill.</Text>
        ) : (
          <Table.ScrollArea
            borderWidth="1px"
            maxHeight={["calc(100vh - 400px)", "calc(100vh - 300px)"]}
          >
            <Table.Root
              size="sm"
              variant="outline"
              showColumnBorder
              fontSize={["xs", "sm", "sm"]}
            >
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader width={"5%"}>
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
                  <Table.ColumnHeader width={"45%"}>Title</Table.ColumnHeader>
                  <Table.ColumnHeader width={"25%"}>Artist</Table.ColumnHeader>
                  <Table.ColumnHeader width={"13%"}>Source</Table.ColumnHeader>
                  <Table.ColumnHeader width={"12%"}>Status</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {tracks.map((track) => (
                  <Table.Row
                    key={track.id}
                    data-selected={
                      selected.has(track.track_id) ? "" : undefined
                    }
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
                    <Table.Cell maxW="220px">
                      <Text truncate title={track.title}>
                        {track.title}
                      </Text>
                    </Table.Cell>
                    <Table.Cell maxW="140px">
                      <Text truncate title={track.artist}>
                        {track.artist}
                      </Text>
                    </Table.Cell>
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
                      ) : track.spotify_url ? (
                        <a
                          href={track.spotify_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Spotify
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
          </Table.ScrollArea>
        )}
        <Stack align="center" my={4}>
          <Pagination.Root count={total} pageSize={pageSize} page={page}>
            <ButtonGroup variant="ghost" size="md">
              <Pagination.PrevTrigger asChild>
                <IconButton
                  aria-label="Previous page"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  <LuChevronLeft />
                </IconButton>
              </Pagination.PrevTrigger>
              <Pagination.Items
                render={(pageObj: { type: "page"; value: number }) => (
                  <IconButton
                    key={pageObj.value}
                    variant={pageObj.value === page ? "solid" : "outline"}
                    aria-current={pageObj.value === page ? "page" : undefined}
                    onClick={() => setPage(pageObj.value)}
                  >
                    {pageObj.value}
                  </IconButton>
                )}
              />
              <Pagination.NextTrigger asChild>
                <IconButton
                  aria-label="Next page"
                  onClick={() => setPage((p) => p + 1)}
                >
                  <LuChevronRight />
                </IconButton>
              </Pagination.NextTrigger>
            </ButtonGroup>
          </Pagination.Root>
        </Stack>
      </Container>
    </>
  );
}
