"use client";

import React, { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Box,
  EmptyState,
  Flex,
  Text,
  VStack,
  Skeleton,
  Dialog,
  Portal,
  Button,
  Badge,
  Card,
  SimpleGrid,
  Progress,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { FiHeadphones } from "react-icons/fi";

import DraggableTrackList from "@/components/DraggableTrackList";
import { useSearchResults } from "@/hooks/useSearchResults";
import { useTrackEditor } from "@/providers/TrackEditProvider";
import PlaylistItemMenu from "@/components/PlaylistItemMenu";
import { usePlaylistTrackIdsQuery } from "@/hooks/usePlaylistTrackIdsQuery";
import { usePlaylistTracksQuery } from "@/hooks/usePlaylistTracksQuery";
import PlaylistActionsMenu from "./PlaylistActionsMenu";
import { usePlaylistSaveDialog } from "@/hooks/usePlaylistSaveDialog";
import { usePlaylistMutations } from "@/hooks/usePlaylistMutations";
import { usePlaylistActions } from "@/hooks/usePlaylistActions";
import PlaylistRecommendations from "./PlaylistRecommendations";
import { Track } from "@/types/track";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import FriendSelectDialog from "@/components/FriendSelectDialog";
import { toaster } from "@/components/ui/toaster";
import {
  importPlaylist,
  updatePlaylist,
  type PlaylistTrackPayload,
} from "@/services/internalApi/playlists";
import { analyzeTrackAsync } from "@/services/internalApi/tracks";
import NamePlaylistDialog from "@/components/NamePlaylistDialog";
import { queryKeys } from "@/lib/queryKeys";

const PlaylistViewer = ({ playlistId }: { playlistId?: number }) => {
  const { playlistCounts } = useSearchResults({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // State for friend selection dialog
  const [friendSelectDialogOpen, setFriendSelectDialogOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    tracks: PlaylistTrackPayload[];
  } | null>(null);

  // New query-based hooks
  const {
    tracks: tracksPlaylist,
    playlistName,
    isPending: trackIdsLoading,
    refetch: refetchTrackIds,
  } = usePlaylistTrackIdsQuery(playlistId);

  const { tracks, isPending: tracksLoading } = usePlaylistTracksQuery(
    tracksPlaylist,
    tracksPlaylist.length > 0
  );

  // New mutation and action hooks
  const {
    moveTrack,
    removeFromPlaylist,
    addToPlaylist,
    sortGreedy,
    sortGenetic,
    isGeneticSorting,
  } = usePlaylistMutations(playlistId, () => setHasUnsavedChanges(true));

  const { replacePlaylist } = usePlaylistPlayer();

  const { exportPlaylist, exportToPDF, getTotalPlaytime } =
    usePlaylistActions(playlistId);

  const { openTrackEditor } = useTrackEditor();
  const {
    Dialog: SaveDialog,
    open: openSaveDialog,
    saveExisting,
  } = usePlaylistSaveDialog(playlistId, () => setHasUnsavedChanges(false));
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [isEnqueuingDownloads, setIsEnqueuingDownloads] = useState(false);
  const [recommendationsModalOpen, setRecommendationsModalOpen] = useState(false);
  const [recommendationsPlaylistSnapshot, setRecommendationsPlaylistSnapshot] = useState<Track[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (playlistName) {
      setRenameName(playlistName);
      setDuplicateName(`${playlistName} (Copy)`);
    } else if (playlistId) {
      setRenameName(`Playlist ${playlistId}`);
      setDuplicateName(`Playlist ${playlistId} (Copy)`);
    }
  }, [playlistId, playlistName]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Get total playtime for display
  const { formatted: totalPlaytimeFormatted } = getTotalPlaytime();
  const playlistStats = useMemo(() => {
    const genreCounts = new Map<string, number>();
    const styleCounts = new Map<string, number>();
    const keyCounts = new Map<string, number>();
    let bpmCount = 0;
    let bpmSum = 0;
    let bpmMin = Number.POSITIVE_INFINITY;
    let bpmMax = Number.NEGATIVE_INFINITY;
    let ratingCount = 0;
    let ratingSum = 0;
    let favoritesCount = 0;
    let localAudioCount = 0;

    for (const track of tracks) {
      for (const genre of track.genres || []) {
        const label = genre.trim();
        if (!label) continue;
        genreCounts.set(label, (genreCounts.get(label) ?? 0) + 1);
      }
      for (const style of track.styles || []) {
        const label = style.trim();
        if (!label) continue;
        styleCounts.set(label, (styleCounts.get(label) ?? 0) + 1);
      }

      const key = typeof track.key === "string" ? track.key.trim() : "";
      if (key) {
        keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
      }

      const bpmValueRaw = typeof track.bpm === "string" ? Number(track.bpm) : Number(track.bpm);
      if (Number.isFinite(bpmValueRaw) && bpmValueRaw > 0) {
        bpmCount += 1;
        bpmSum += bpmValueRaw;
        bpmMin = Math.min(bpmMin, bpmValueRaw);
        bpmMax = Math.max(bpmMax, bpmValueRaw);
      }

      const rating = typeof track.star_rating === "number" ? track.star_rating : null;
      if (rating !== null) {
        ratingCount += 1;
        ratingSum += rating;
        if (rating >= 4) favoritesCount += 1;
      }

      if (track.local_audio_url) {
        localAudioCount += 1;
      }
    }

    const top = (counts: Map<string, number>, limit = 4): Array<[string, number]> =>
      Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

    return {
      trackCount: tracks.length,
      topGenres: top(genreCounts),
      topStyles: top(styleCounts),
      topKeys: top(keyCounts, 3),
      bpmSummary:
        bpmCount > 0
          ? {
              avg: Math.round(bpmSum / bpmCount),
              min: Math.round(bpmMin),
              max: Math.round(bpmMax),
              coverage: Math.round((bpmCount / tracks.length) * 100),
            }
          : null,
      ratingSummary:
        ratingCount > 0
          ? {
              avg: Number((ratingSum / ratingCount).toFixed(1)),
              favoritesCount,
            }
          : null,
      localAudioCoverage:
        tracks.length > 0 ? Math.round((localAudioCount / tracks.length) * 100) : 0,
    };
  }, [tracks]);

  // Append tracks to the current playlist
  const appendTracksToPlaylist = async (newTracks: PlaylistTrackPayload[]) => {
    if (!playlistId) return;

    try {
      // Combine existing tracks with new tracks
      const combinedTracks: PlaylistTrackPayload[] = [
        ...tracksPlaylist.map((t) => ({
          track_id: t.track_id,
          friend_id: t.friend_id,
        })),
        ...newTracks,
      ];

      await updatePlaylist(playlistId, { tracks: combinedTracks });
      toaster.create({
        title: `Appended ${newTracks.length} tracks to playlist`,
        type: "success",
      });
      refetchTrackIds();
    } catch (err) {
      console.error("Append error:", err);
      toaster.create({ title: "Error appending tracks", type: "error" });
    }
  };

  const handleFriendSelectConfirm = async () => {
    if (!pendingImport || !selectedFriendId) return;
    try {
      const resolved = pendingImport.tracks
        .map((t) => ({
          ...t,
          friend_id: t.friend_id ?? selectedFriendId,
        }))
        .filter(
          (t) =>
            typeof t.track_id === "string" &&
            t.track_id.length > 0 &&
            typeof t.friend_id === "number"
        ) as PlaylistTrackPayload[];

      if (resolved.length === 0) {
        toaster.create({ title: "No valid tracks to import", type: "error" });
        return;
      }

      await appendTracksToPlaylist(resolved);
    } finally {
      setFriendSelectDialogOpen(false);
      setPendingImport(null);
      setSelectedFriendId(null);
    }
  };

  const handleFriendSelectCancel = () => {
    setFriendSelectDialogOpen(false);
    setPendingImport(null);
    setSelectedFriendId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEnqueueMissingDownloads = async () => {
    if (!tracks || tracks.length === 0) {
      toaster.create({ title: "No tracks to enqueue", type: "info" });
      return;
    }

    const missingAudio = tracks.filter(
      (t) =>
        !t.local_audio_url &&
        (t.apple_music_url || t.youtube_url || t.soundcloud_url)
    );

    if (missingAudio.length === 0) {
      toaster.create({ title: "All tracks already have audio", type: "info" });
      return;
    }

    setIsEnqueuingDownloads(true);
    let enqueued = 0;
    let failed = 0;

    for (const track of missingAudio) {
      try {
        await analyzeTrackAsync({
          track_id: track.track_id,
          friend_id: track.friend_id,
          title: track.title,
          artist: track.artist,
          apple_music_url: track.apple_music_url || undefined,
          youtube_url: track.youtube_url || undefined,
          soundcloud_url: track.soundcloud_url || undefined,
        });
        enqueued += 1;
      } catch (err) {
        console.error("Failed to enqueue download for track", track.track_id, err);
        failed += 1;
      }
    }

    setIsEnqueuingDownloads(false);

    toaster.create({
      title: `Enqueued ${enqueued} track${enqueued === 1 ? "" : "s"} for download${
        failed ? ` (${failed} failed)` : ""
      }`,
      type: failed ? "warning" : "success",
    });
  };

  const handleDuplicatePlaylist = async (name: string) => {
    const finalName = name.trim();
    if (!finalName) {
      toaster.create({ title: "Please enter a playlist name", type: "error" });
      return;
    }
    if (tracksPlaylist.length === 0) {
      toaster.create({ title: "Cannot duplicate an empty playlist", type: "error" });
      return;
    }
    try {
      await importPlaylist(
        finalName,
        tracksPlaylist.map(({ track_id, friend_id }) => ({
          track_id,
          friend_id,
        }))
      );
      toaster.create({
        title: `Duplicated playlist as "${finalName}"`,
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists() });
      setDuplicateDialogOpen(false);
    } catch (err) {
      console.error("Duplicate playlist error:", err);
      toaster.create({ title: "Failed to duplicate playlist", type: "error" });
    }
  };

  const handleRenamePlaylist = async (name: string) => {
    const finalName = name.trim();
    if (!finalName) {
      toaster.create({ title: "Please enter a playlist name", type: "error" });
      return;
    }
    if (!playlistId) {
      toaster.create({ title: "Cannot rename an unsaved playlist", type: "error" });
      return;
    }
    try {
      await updatePlaylist(playlistId, { name: finalName });
      toaster.create({
        title: "Playlist renamed",
        type: "success",
      });
      queryClient.setQueryData(
        queryKeys.playlistTrackIds(playlistId),
        (prev: unknown) => {
          if (
            prev &&
            typeof prev === "object" &&
            !Array.isArray(prev) &&
            "playlist_name" in (prev as Record<string, unknown>)
          ) {
            return { ...(prev as Record<string, unknown>), playlist_name: finalName };
          }
          return prev;
        }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists() });
      setRenameDialogOpen(false);
    } catch (err) {
      console.error("Rename playlist error:", err);
      toaster.create({ title: "Failed to rename playlist", type: "error" });
    }
  };

  // Render function for playlist item menu buttons
  const renderPlaylistButtons = React.useCallback(
    (track: Track | undefined, idx: number) => {
      return track ? (
        <PlaylistItemMenu
          key="menu"
          idx={idx}
          total={tracksPlaylist.length}
          track={track}
          moveTrack={moveTrack}
          removeFromPlaylist={removeFromPlaylist}
          openTrackEditor={openTrackEditor}
          size="xs"
        />
      ) : null;
    },
    [tracksPlaylist.length, moveTrack, removeFromPlaylist, openTrackEditor]
  );

  // Import JSON and append to this playlist
  const handleImportJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = JSON.parse(await file.text());
      const tracksData: PlaylistTrackPayload[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.tracks)
        ? data.tracks
        : [];

      const cleanTracks = tracksData
        .map((t) => ({
          track_id: t.track_id,
          friend_id: t.friend_id,
          username: t.username,
          title: t.title,
          artist: t.artist,
          album: t.album,
          year: t.year,
          styles: t.styles,
          genres: t.genres,
          duration: t.duration,
          duration_seconds: t.duration_seconds,
          discogs_url: t.discogs_url,
          apple_music_url: t.apple_music_url,
          youtube_url: t.youtube_url,
          spotify_url: t.spotify_url,
          soundcloud_url: t.soundcloud_url,
          album_thumbnail: t.album_thumbnail,
          local_tags: t.local_tags,
          bpm: t.bpm as PlaylistTrackPayload["bpm"],
          key: t.key,
          danceability: t.danceability as PlaylistTrackPayload["danceability"],
          notes: t.notes,
          star_rating: t.star_rating,
          release_id: t.release_id,
          mood_happy: t.mood_happy,
          mood_sad: t.mood_sad,
          mood_relaxed: t.mood_relaxed,
          mood_aggressive: t.mood_aggressive,
        }))
        .filter(
          (t) =>
            typeof t.track_id === "string" &&
            t.track_id.length > 0 &&
            typeof t.friend_id === "number"
        ) as PlaylistTrackPayload[];

      if (cleanTracks.length === 0) {
        toaster.create({
          title: "No valid tracks found in JSON",
          type: "error",
        });
        return;
      }

      const missingFriend = cleanTracks.some(
        (t) => typeof t.friend_id !== "number"
      );
      if (missingFriend) {
        setPendingImport({
          tracks: cleanTracks as PlaylistTrackPayload[],
        });
        setFriendSelectDialogOpen(true);
        return;
      }

      await appendTracksToPlaylist(cleanTracks as PlaylistTrackPayload[]);
    } catch (err) {
      console.error("Import JSON error:", err);
      toaster.create({ title: "Error importing playlist JSON", type: "error" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (trackIdsLoading || tracksLoading) {
    return (
      <Box>
        {/* Header skeleton */}
        <Flex align="flex-start" w="100%" pt={3} mb={2} gap={3}>
          <Box flex="1">
            <Skeleton height="20px" width="220px" mb={2} />
            <Skeleton height="14px" width="180px" />
          </Box>
          <Box>
            <Skeleton height="32px" width="40px" borderRadius="md" />
          </Box>
        </Flex>

        {/* List skeleton */}
        <Box>
          {Array.from({ length: 6 }).map((_, i) => (
            <Flex key={i} align="center" gap={3} py={2}>
              <Skeleton height="36px" width="36px" borderRadius="md" />
              <Box flex="1">
                <Skeleton
                  height="16px"
                  width={i % 3 === 0 ? "60%" : "75%"}
                  mb={1}
                />
                <Skeleton height="12px" width={i % 2 === 0 ? "35%" : "45%"} />
              </Box>
              <Skeleton height="28px" width="28px" borderRadius="full" />
            </Flex>
          ))}
        </Box>
      </Box>
    );
  }

  if (tracksPlaylist.length === 0) {
    return (
      <Box overflowY="auto">
        <EmptyState.Root size={"sm"}>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiHeadphones />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>Your playlist is empty</EmptyState.Title>
              <EmptyState.Description>
                Add tracks to your playlist to get started.
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      </Box>
    );
  }

  return (
    <>
      <Flex align="flex-start" w="100%" pt={3}>
        <Box flex="1">
          <Flex align="center" gap={2} flexWrap="wrap">
            <Text fontWeight="semibold">
              {playlistName || `Playlist ${playlistId ?? ""}`.trim()}
            </Text>
            {hasUnsavedChanges && (
              <Badge colorPalette="orange" variant="solid" size="sm">
                Unsaved changes
              </Badge>
            )}
          </Flex>
          <Text fontSize="sm" color="gray.500" mb={2}>
            Total Playtime: {totalPlaytimeFormatted}
            {/* Playlist Recommendations */}
          </Text>
        </Box>
        <Flex gap={2} align="flex-start">
          {hasUnsavedChanges && playlistId && (
            <Button
              size="sm"
              colorScheme="blue"
              onClick={saveExisting}
            >
              Save Changes
            </Button>
          )}
          <PlaylistActionsMenu
            disabled={tracksPlaylist.length === 0}
            onSortGreedy={() => {
              console.log("sort greed");
              sortGreedy();
            }}
            onSortGenetic={sortGenetic}
            onExportJson={exportPlaylist}
          onImportJson={() => fileInputRef.current?.click()}
          onExportPdf={() =>
            exportToPDF(playlistName || `Playlist ${playlistId ?? ""}`.trim())
          }
          onOpenSaveDialog={playlistId ? saveExisting : openSaveDialog}
          isGeneticSorting={isGeneticSorting}
          onDuplicate={playlistId ? () => setDuplicateDialogOpen(true) : undefined}
          onRename={playlistId ? () => setRenameDialogOpen(true) : undefined}
          onEnqueueMissingDownloads={
            isEnqueuingDownloads ? undefined : handleEnqueueMissingDownloads
          }
          onOpenRecommendations={() => {
            setRecommendationsPlaylistSnapshot([...tracks]);
            setRecommendationsModalOpen(true);
          }}
          enqueuePlaylist={() =>
            replacePlaylist(tracks, {
              autoplay: true,
              startIndex: 0,
            })
            }
          />
        </Flex>
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={3} mb={4}>
        <Card.Root size="sm" variant="outline">
          <Card.Body>
            <VStack align="start" gap={1}>
              <Text fontSize="xs" color="gray.500">Tracks</Text>
              <Text fontWeight="bold" fontSize="lg">{playlistStats.trackCount}</Text>
              <Text fontSize="xs" color="gray.500">Audio Ready: {playlistStats.localAudioCoverage}%</Text>
              <Progress.Root value={playlistStats.localAudioCoverage} size="xs" width="100%">
                <Progress.Track>
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
            </VStack>
          </Card.Body>
        </Card.Root>
        <Card.Root size="sm" variant="outline">
          <Card.Body>
            <VStack align="start" gap={1}>
              <Text fontSize="xs" color="gray.500">Top Genres</Text>
              <Flex gap={1} wrap="wrap">
                {playlistStats.topGenres.length > 0 ? playlistStats.topGenres.map(([name, count]) => (
                  <Badge key={`genre-${name}`} variant="subtle">
                    {name} ({count})
                  </Badge>
                )) : <Text fontSize="sm" color="gray.500">No genre tags</Text>}
              </Flex>
            </VStack>
          </Card.Body>
        </Card.Root>
        <Card.Root size="sm" variant="outline">
          <Card.Body>
            <VStack align="start" gap={1}>
              <Text fontSize="xs" color="gray.500">Rhythm & Harmony</Text>
              {playlistStats.bpmSummary ? (
                <>
                  <Text fontSize="sm">BPM avg {playlistStats.bpmSummary.avg} ({playlistStats.bpmSummary.min}-{playlistStats.bpmSummary.max})</Text>
                  <Text fontSize="xs" color="gray.500">BPM coverage: {playlistStats.bpmSummary.coverage}%</Text>
                </>
              ) : (
                <Text fontSize="sm" color="gray.500">No BPM data</Text>
              )}
              <Flex gap={1} wrap="wrap">
                {playlistStats.topKeys.length > 0 ? playlistStats.topKeys.map(([name, count]) => (
                  <Badge key={`key-${name}`} variant="subtle">
                    {name} ({count})
                  </Badge>
                )) : <Text fontSize="xs" color="gray.500">No key data</Text>}
              </Flex>
            </VStack>
          </Card.Body>
        </Card.Root>
        <Card.Root size="sm" variant="outline">
          <Card.Body>
            <VStack align="start" gap={1}>
              <Text fontSize="xs" color="gray.500">Ratings & Styles</Text>
              {playlistStats.ratingSummary ? (
                <>
                  <Text fontSize="sm">Avg rating: {playlistStats.ratingSummary.avg}</Text>
                  <Text fontSize="xs" color="gray.500">4★+ tracks: {playlistStats.ratingSummary.favoritesCount}</Text>
                </>
              ) : (
                <Text fontSize="sm" color="gray.500">No ratings yet</Text>
              )}
              <Flex gap={1} wrap="wrap">
                {playlistStats.topStyles.length > 0 ? playlistStats.topStyles.map(([name, count]) => (
                  <Badge key={`style-${name}`} variant="subtle">
                    {name} ({count})
                  </Badge>
                )) : <Text fontSize="xs" color="gray.500">No style tags</Text>}
              </Flex>
            </VStack>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>
      <Box overflowY="auto">
        <DraggableTrackList
          tracksPlaylist={tracksPlaylist}
          tracks={tracks}
          moveTrack={moveTrack}
          droppableId="playlist-droppable"
          renderTrackButtons={renderPlaylistButtons}
          trackResultProps={{
            playlistMode: true,
            playlistCount: playlistCounts,
          }}
        />
        {/* <PlaylistRecommendations
          playlist={tracks}
          onAddToPlaylist={addToPlaylist}
          onEditTrack={openTrackEditor}
        /> */}
        <SaveDialog />
        <NamePlaylistDialog
          open={duplicateDialogOpen}
          name={duplicateName}
          setName={setDuplicateName}
          trackCount={tracksPlaylist.length}
          confirmLabel="Duplicate Playlist"
          onConfirm={handleDuplicatePlaylist}
          onCancel={() => setDuplicateDialogOpen(false)}
        />
        <NamePlaylistDialog
          open={renameDialogOpen}
          name={renameName}
          setName={setRenameName}
          confirmLabel="Rename Playlist"
          onConfirm={handleRenamePlaylist}
          onCancel={() => setRenameDialogOpen(false)}
        />
        <input
          type="file"
          accept=".json,application/json"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImportJson}
        />
        <FriendSelectDialog
          open={friendSelectDialogOpen}
          selectedFriendId={selectedFriendId}
          setSelectedFriendId={(id) => setSelectedFriendId(id)}
          trackCount={pendingImport?.tracks.length}
          onConfirm={handleFriendSelectConfirm}
          onCancel={handleFriendSelectCancel}
        />

        {/* AI Recommendations Modal */}
        <Dialog.Root
          open={recommendationsModalOpen}
          onOpenChange={(e) => setRecommendationsModalOpen(e.open)}
          size="xl"
        >
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Flex justify="space-between" align="center" width="100%">
                    <Dialog.Title>AI Recommendations</Dialog.Title>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRecommendationsPlaylistSnapshot([...tracks])}
                      mr={8}
                    >
                      Refresh
                    </Button>
                  </Flex>
                </Dialog.Header>
                <Dialog.Body maxH="70vh" overflowY="auto">
                  {recommendationsModalOpen && (
                    <PlaylistRecommendations
                      playlist={recommendationsPlaylistSnapshot}
                      limit={50}
                      onAddToPlaylist={addToPlaylist}
                      onEditTrack={openTrackEditor}
                    />
                  )}
                </Dialog.Body>
                <Dialog.CloseTrigger />
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </Box>
    </>
  );
};

export default PlaylistViewer;
