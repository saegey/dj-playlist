"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Dialog,
  EmptyState,
  Flex,
  HStack,
  Input,
  Portal,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { FiClock, FiDisc, FiTrash2 } from "react-icons/fi";
import { toaster } from "@/components/ui/toaster";
import { useSpinsQuery, useSpinMutations } from "@/hooks/useSpinsQuery";
import { queryKeys } from "@/lib/queryKeys";
import {
  getAlbumPlayableStructure,
  type AlbumPlayableStructureResponse,
} from "@/services/internalApi/albums";

type Props = {
  releaseId: string;
  friendId: number;
  albumTitle: string;
};

type SelectionMode = "sides" | "tracks";
type TrackLookupEntry = ReturnType<typeof buildTrackLookup> extends Map<string, infer TValue>
  ? TValue
  : never;

function formatDateTimeLocalInput(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatPlayedAt(dateString: string): string {
  return new Date(dateString).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function buildTrackLookup(structure?: AlbumPlayableStructureResponse) {
  const map = new Map<
    string,
    AlbumPlayableStructureResponse["sides"][number]["tracks"][number] & {
      side_key: string;
      side_label: string;
    }
  >();

  for (const side of structure?.sides ?? []) {
    for (const track of side.tracks) {
      map.set(`${track.track_id}:${track.friend_id}`, {
        ...track,
        side_key: side.side_key,
        side_label: side.side_label,
      });
    }
  }

  return map;
}

export default function AlbumSpinPanel({
  releaseId,
  friendId,
  albumTitle,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [selectionMode, setSelectionMode] = React.useState<SelectionMode>("sides");
  const [selectedSideKeys, setSelectedSideKeys] = React.useState<string[]>([]);
  const [selectedTrackKeys, setSelectedTrackKeys] = React.useState<string[]>([]);
  const [playedAtInput, setPlayedAtInput] = React.useState(() =>
    formatDateTimeLocalInput(new Date())
  );
  const [note, setNote] = React.useState("");
  const [contextType, setContextType] = React.useState("");

  const playableStructureQuery = useQuery({
    queryKey: queryKeys.albumPlayableStructure(releaseId, friendId),
    queryFn: () => getAlbumPlayableStructure(releaseId, friendId),
    enabled: open && !!releaseId && !!friendId,
    staleTime: 5 * 60_000,
  });
  const spinsQuery = useSpinsQuery(
    {
      friend_id: friendId,
      release_id: releaseId,
      limit: 8,
      offset: 0,
    },
    { enabled: !!releaseId && !!friendId }
  );
  const { createSpin, deleteSpin, createSpinPending, deleteSpinPending } =
    useSpinMutations(friendId);

  const trackLookup = React.useMemo(
    () => buildTrackLookup(playableStructureQuery.data),
    [playableStructureQuery.data]
  );
  const selectedTracks = React.useMemo(() => {
    return selectedTrackKeys
      .map((key) => trackLookup.get(key))
      .filter((track): track is TrackLookupEntry => Boolean(track));
  }, [selectedTrackKeys, trackLookup]);
  const selectedTrackCount = selectedTracks.length;
  const selectedSideCount = React.useMemo(() => {
    if (selectionMode === "sides") return selectedSideKeys.length;
    return new Set(selectedTracks.map((track) => track.side_key)).size;
  }, [selectedSideKeys, selectedTracks, selectionMode]);
  const albumSideCount = playableStructureQuery.data?.sides.length ?? 0;
  const isFullAlbumSpin =
    selectionMode === "sides" &&
    albumSideCount > 0 &&
    selectedSideCount === albumSideCount;

  const resetForm = React.useCallback(() => {
    setSelectionMode("sides");
    setSelectedSideKeys([]);
    setSelectedTrackKeys([]);
    setPlayedAtInput(formatDateTimeLocalInput(new Date()));
    setNote("");
    setContextType("");
  }, []);

  const toggleSide = (sideKey: string) => {
    setSelectedSideKeys((current) =>
      current.includes(sideKey)
        ? current.filter((key) => key !== sideKey)
        : [...current, sideKey]
    );
  };

  const toggleTrack = (trackKey: string) => {
    setSelectedTrackKeys((current) =>
      current.includes(trackKey)
        ? current.filter((key) => key !== trackKey)
        : [...current, trackKey]
    );
  };

  const handleDialogOpenChange = (details: { open: boolean }) => {
    setOpen(details.open);
    if (details.open) {
      resetForm();
    }
  };

  const handleSubmit = async () => {
    if (!playedAtInput) {
      toaster.create({
        title: "Missing played time",
        description: "Choose when the vinyl spin happened.",
        type: "error",
      });
      return;
    }

    try {
      if (selectionMode === "sides") {
        if (selectedSideKeys.length === 0) {
          toaster.create({
            title: "No sides selected",
            description: "Choose at least one side to log a spin.",
            type: "error",
          });
          return;
        }

        await createSpin({
          friend_id: friendId,
          release_id: releaseId,
          played_at: new Date(playedAtInput).toISOString(),
          note: note.trim() || null,
          context_type: contextType.trim() || null,
          side_keys: selectedSideKeys,
        });
      } else {
        if (selectedTracks.length === 0) {
          toaster.create({
            title: "No tracks selected",
            description: "Choose at least one track to log a spin.",
            type: "error",
          });
          return;
        }

        await createSpin({
          friend_id: friendId,
          release_id: releaseId,
          played_at: new Date(playedAtInput).toISOString(),
          note: note.trim() || null,
          context_type: contextType.trim() || null,
          track_refs: selectedTracks.map((track) => ({
            track_id: track.track_id,
            friend_id: track.friend_id,
          })),
        });
      }

      toaster.create({
        title: "Spin logged",
        description:
          selectionMode === "sides"
            ? `Logged ${selectedSideCount} side${selectedSideCount === 1 ? "" : "s"} for ${albumTitle}`
            : `Logged ${selectedTrackCount} track${selectedTrackCount === 1 ? "" : "s"} for ${albumTitle}`,
        type: "success",
      });
      setOpen(false);
      resetForm();
    } catch (error) {
      toaster.create({
        title: "Failed to log spin",
        description: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      });
    }
  };

  const handleDeleteSpin = async (spinId: number) => {
    try {
      await deleteSpin(spinId);
      toaster.create({
        title: "Spin deleted",
        type: "success",
      });
    } catch (error) {
      toaster.create({
        title: "Failed to delete spin",
        description: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      });
    }
  };

  return (
    <Stack gap={4}>
      <Flex justify="space-between" align={{ base: "stretch", md: "center" }} gap={3} wrap="wrap">
        <VStack align="start" gap={1}>
          <HStack gap={2}>
            <FiDisc />
            <Text fontWeight="semibold">Vinyl spins</Text>
          </HStack>
          <Text fontSize="sm" color="fg.muted">
            Manual logging for physical LP plays only.
          </Text>
        </VStack>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Log Spin
        </Button>
      </Flex>

      <Box borderWidth="1px" borderRadius="md" p={4}>
        {spinsQuery.isLoading ? (
          <Flex justify="center" py={6}>
            <Spinner size="sm" />
          </Flex>
        ) : spinsQuery.spins.length === 0 ? (
          <EmptyState.Root size="sm">
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FiClock />
              </EmptyState.Indicator>
              <VStack textAlign="center">
                <EmptyState.Title>No logged spins yet</EmptyState.Title>
                <EmptyState.Description>
                  Start with a side, a few tracks, or the whole album.
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Stack gap={3}>
            {spinsQuery.spins.map((item) => (
              <Flex
                key={item.session.id}
                justify="space-between"
                align={{ base: "start", md: "center" }}
                gap={3}
                borderWidth="1px"
                borderRadius="md"
                p={3}
                direction={{ base: "column", md: "row" }}
              >
                <VStack align="start" gap={1} minW={0}>
                  <HStack gap={2} wrap="wrap">
                    <Badge colorPalette={item.derived.is_full_album_spin ? "green" : "blue"}>
                      {item.derived.is_full_album_spin
                        ? "Full album"
                        : item.session.selection_mode === "sides"
                          ? `${item.derived.selected_side_count} side${item.derived.selected_side_count === 1 ? "" : "s"}`
                          : `${item.derived.track_count} track${item.derived.track_count === 1 ? "" : "s"}`}
                    </Badge>
                    {item.session.context_type && (
                      <Badge variant="outline">{item.session.context_type}</Badge>
                    )}
                  </HStack>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatPlayedAt(item.session.played_at)}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {item.session.selection_mode === "sides"
                      ? `${item.derived.track_count} track events expanded from side selection`
                      : `${item.derived.track_count} logged track events`}
                  </Text>
                  {item.session.note && (
                    <Text fontSize="sm" color="fg.muted">
                      {item.session.note}
                    </Text>
                  )}
                </VStack>
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  loading={deleteSpinPending}
                  onClick={() => handleDeleteSpin(item.session.id)}
                >
                  <FiTrash2 /> Delete
                </Button>
              </Flex>
            ))}
          </Stack>
        )}
      </Box>

      <Dialog.Root open={open} onOpenChange={handleDialogOpenChange} size="xl">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Log Vinyl Spin</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body pb={6}>
                <Stack gap={4}>
                  <Text fontSize="sm" color="fg.muted">
                    This logs a physical record spin, separate from app playback.
                  </Text>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={1}>
                        Played At
                      </Text>
                      <Input
                        type="datetime-local"
                        value={playedAtInput}
                        onChange={(event) => setPlayedAtInput(event.target.value)}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={1}>
                        Context
                      </Text>
                      <Input
                        value={contextType}
                        onChange={(event) => setContextType(event.target.value)}
                        placeholder="home, gig, practice"
                      />
                    </Box>
                  </SimpleGrid>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Note
                    </Text>
                    <Textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Optional note about this spin"
                      rows={3}
                    />
                  </Box>

                  <HStack gap={2} wrap="wrap">
                    <Button
                      size="sm"
                      variant={selectionMode === "sides" ? "solid" : "outline"}
                      onClick={() => setSelectionMode("sides")}
                    >
                      Log by sides
                    </Button>
                    <Button
                      size="sm"
                      variant={selectionMode === "tracks" ? "solid" : "outline"}
                      onClick={() => setSelectionMode("tracks")}
                    >
                      Log by tracks
                    </Button>
                    {selectionMode === "sides" ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setSelectedSideKeys(
                              playableStructureQuery.data?.sides.map((side) => side.side_key) ?? []
                            )
                          }
                        >
                          Select all sides
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedSideKeys([])}
                        >
                          Clear
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setSelectedTrackKeys(Array.from(trackLookup.keys()))
                          }
                        >
                          Select all tracks
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTrackKeys([])}
                        >
                          Clear
                        </Button>
                      </>
                    )}
                  </HStack>

                  <HStack gap={2} wrap="wrap">
                    <Badge colorPalette="blue">
                      {selectionMode === "sides"
                        ? `${selectedSideCount} side${selectedSideCount === 1 ? "" : "s"} selected`
                        : `${selectedTrackCount} track${selectedTrackCount === 1 ? "" : "s"} selected`}
                    </Badge>
                    <Badge variant="outline">
                      {selectedTrackCount} track event{selectedTrackCount === 1 ? "" : "s"}
                    </Badge>
                    {isFullAlbumSpin && <Badge colorPalette="green">Full album</Badge>}
                  </HStack>

                  {playableStructureQuery.isLoading ? (
                    <Flex justify="center" py={8}>
                      <Spinner size="sm" />
                    </Flex>
                  ) : playableStructureQuery.error ? (
                    <Text color="red.500">
                      {playableStructureQuery.error instanceof Error
                        ? playableStructureQuery.error.message
                        : "Failed to load playable structure"}
                    </Text>
                  ) : (
                    <Stack gap={3} maxH="420px" overflowY="auto" pr={1}>
                      {playableStructureQuery.data?.sides.map((side) => (
                        <Box key={side.side_key} borderWidth="1px" borderRadius="md" p={3}>
                          <Flex justify="space-between" gap={3} align="start">
                            <VStack align="start" gap={1}>
                              <HStack gap={2}>
                                {selectionMode === "sides" && (
                                  <Checkbox.Root
                                    checked={selectedSideKeys.includes(side.side_key)}
                                    onCheckedChange={() => toggleSide(side.side_key)}
                                  >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                  </Checkbox.Root>
                                )}
                                <Text fontWeight="semibold">{side.side_label}</Text>
                                <Badge variant="outline">{side.track_count} tracks</Badge>
                              </HStack>
                            </VStack>
                          </Flex>
                          <Stack gap={2} mt={3}>
                            {side.tracks.map((track) => {
                              const trackKey = `${track.track_id}:${track.friend_id}`;
                              return (
                                <Flex
                                  key={trackKey}
                                  align="center"
                                  justify="space-between"
                                  gap={3}
                                  p={2}
                                  borderRadius="md"
                                  bg="bg.subtle"
                                >
                                  <HStack gap={3} minW={0}>
                                    {selectionMode === "tracks" && (
                                      <Checkbox.Root
                                        checked={selectedTrackKeys.includes(trackKey)}
                                        onCheckedChange={() => toggleTrack(trackKey)}
                                      >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                      </Checkbox.Root>
                                    )}
                                    <VStack align="start" gap={0} minW={0}>
                                      <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                                        {track.title}
                                      </Text>
                                      <Text fontSize="xs" color="fg.muted">
                                        {track.position ? `${track.position} · ` : ""}
                                        {track.artist}
                                      </Text>
                                    </VStack>
                                  </HStack>
                                </Flex>
                              );
                            })}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <HStack gap={2}>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button loading={createSpinPending} onClick={handleSubmit}>
                    Save Spin
                  </Button>
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Stack>
  );
}
