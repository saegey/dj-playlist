"use client";

import React, { useRef, useState, type ChangeEvent } from "react";
import {
  Box,
  EmptyState,
  Flex,
  Text,
  VStack,
  Skeleton,
} from "@chakra-ui/react";
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
import { updatePlaylist } from "@/services/playlistService";

const PlaylistViewer = ({ playlistId }: { playlistId?: number }) => {
  const { playlistCounts } = useSearchResults({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for friend selection dialog
  const [friendSelectDialogOpen, setFriendSelectDialogOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    tracks: Array<{ track_id: string; username?: string; friend_id?: number }>;
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
  } = usePlaylistMutations(playlistId);

  const { replacePlaylist } = usePlaylistPlayer();

  const { exportPlaylist, exportToPDF, getTotalPlaytime } =
    usePlaylistActions(playlistId);

  const { openTrackEditor } = useTrackEditor();
  const {
    Dialog: SaveDialog,
    open: openSaveDialog,
    saveExisting,
  } = usePlaylistSaveDialog(playlistId);

  // Get total playtime for display
  const { formatted: totalPlaytimeFormatted } = getTotalPlaytime();

  // Append tracks to the current playlist
  const appendTracksToPlaylist = async (
    newTracks: Array<{ track_id: string; friend_id: number }>
  ) => {
    if (!playlistId) return;

    try {
      // Combine existing tracks with new tracks
      const combinedTracks = [
        ...tracksPlaylist.map((t) => ({
          track_id: t.track_id,
          friend_id: t.friend_id,
        })),
        ...newTracks,
      ];

      const res = await updatePlaylist(playlistId, { tracks: combinedTracks });

      if (res.ok) {
        toaster.create({
          title: `Appended ${newTracks.length} tracks to playlist`,
          type: "success",
        });
        refetchTrackIds();
      } else {
        toaster.create({ title: "Failed to append tracks", type: "error" });
      }
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
          track_id: t.track_id,
          friend_id: t.friend_id ?? selectedFriendId,
        }))
        .filter(
          (t): t is { track_id: string; friend_id: number } =>
            typeof t.track_id === "string" && typeof t.friend_id === "number"
        );

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
      const tracksData: Array<{
        track_id?: string;
        friend_id?: number;
        username?: string;
      }> = Array.isArray(data)
        ? data
        : Array.isArray(data?.tracks)
        ? data.tracks
        : [];

      const cleanTracks = tracksData
        .map((t) => ({
          track_id: t.track_id,
          friend_id: t.friend_id,
          username: t.username,
        }))
        .filter((t) => typeof t.track_id === "string" && t.track_id.length > 0);

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
          tracks: cleanTracks as Array<{
            track_id: string;
            username?: string;
            friend_id?: number;
          }>,
        });
        setFriendSelectDialogOpen(true);
        return;
      }

      await appendTracksToPlaylist(
        cleanTracks as Array<{ track_id: string; friend_id: number }>
      );
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
        <Box>
          <Text fontWeight="semibold">
            {playlistName || `Playlist ${playlistId ?? ""}`.trim()}
          </Text>
          <Text fontSize="sm" color="gray.500" mb={2}>
            Total Playtime: {totalPlaytimeFormatted}
            {/* Playlist Recommendations */}
          </Text>
        </Box>
        <Flex flexGrow={1} justify="flex-end" align="flex-start">
          <PlaylistActionsMenu
            disabled={tracksPlaylist.length === 0}
            onSortGreedy={() => {
              console.log("sort greed");
              sortGreedy();
            }}
            onSortGenetic={sortGenetic}
            onExportJson={exportPlaylist}
            onImportJson={() => fileInputRef.current?.click()}
            onExportPdf={() => exportToPDF("playlist.pdf")}
            onOpenSaveDialog={playlistId ? saveExisting : openSaveDialog}
            isGeneticSorting={isGeneticSorting}
            enqueuePlaylist={() =>
              replacePlaylist(tracks, {
                autoplay: true,
                startIndex: 0,
              })
            }
          />
        </Flex>
      </Flex>
      <Box overflowY="auto">
        <DraggableTrackList
          tracksPlaylist={tracksPlaylist}
          tracks={tracks}
          moveTrack={moveTrack}
          droppableId="playlist-droppable"
          renderTrackButtons={renderPlaylistButtons}
          trackResultProps={{
            minimized: true,
            playlistCount: playlistCounts,
          }}
        />
        <PlaylistRecommendations
          playlist={tracks}
          onAddToPlaylist={addToPlaylist}
          onEditTrack={openTrackEditor}
        />
        <SaveDialog />
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
      </Box>
    </>
  );
};

export default PlaylistViewer;
