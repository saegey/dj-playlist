"use client";

import React, { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Box,
  EmptyState,
  Flex,
  Text,
  VStack,
  Skeleton,
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
import { importPlaylist, updatePlaylist } from "@/services/playlistService";
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
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameName, setRenameName] = useState("");

  useEffect(() => {
    if (playlistName) {
      setRenameName(playlistName);
      setDuplicateName(`${playlistName} (Copy)`);
    } else if (playlistId) {
      setRenameName(`Playlist ${playlistId}`);
      setDuplicateName(`Playlist ${playlistId} (Copy)`);
    }
  }, [playlistId, playlistName]);

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
      const res = await importPlaylist(
        finalName,
        tracksPlaylist.map(({ track_id, friend_id }) => ({
          track_id,
          friend_id,
        }))
      );
      if (!res.ok) throw new Error("Failed to duplicate playlist");
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
      const res = await updatePlaylist(playlistId, { name: finalName });
      if (!res.ok) throw new Error("Failed to rename playlist");
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
          onDuplicate={playlistId ? () => setDuplicateDialogOpen(true) : undefined}
          onRename={playlistId ? () => setRenameDialogOpen(true) : undefined}
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
      </Box>
    </>
  );
};

export default PlaylistViewer;
