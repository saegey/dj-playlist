"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Portal,
  Dialog,
  CloseButton,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";

import PlaylistViewer from "@/components/PlaylistViewer";
import { usePlaylistViewer } from "@/hooks/usePlaylistViewer";

import SearchResults from "@/components/SearchResults";
import { useSearchResults } from "@/hooks/useSearchResults";
import { usePlaylists } from "@/hooks/usePlaylists";
import PlaylistManager from "@/components/PlaylistManager";
import type { Track } from "@/types/track";
import { parseDurationToSeconds, formatSeconds } from "@/lib/trackUtils";
import TopMenuBar from "@/components/MenuBar";
import { getMeiliClient } from "@/lib/meili";
import { TrackEditFormProps } from "../components/TrackEditForm";
import { MeiliSearch } from "meilisearch";

const TrackEditForm = dynamic(() => import("../components/TrackEditForm"), {
  ssr: false,
});

export default function SearchPage() {
  const [meiliClient, setMeiliClient] = useState<MeiliSearch | null>(null);

  React.useEffect(() => {
    try {
      const client = getMeiliClient();
      setMeiliClient(client);
    } catch (err) {
      console.warn("Skipping MeiliSearch: ", err);
    }
  }, []);

  const [playlistSidebarMinimized, setPlaylistSidebarMinimized] =
    useState(false);
  const [xmlImportModalOpen, setXmlImportModalOpen] = useState(false);
  // Prevent hydration mismatch for playlist count and playtime
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const {
    query,
    onQueryChange,
    estimatedResults,
    activeFilter,
    activeFilterType,
    clearFilter,
    results,
    playlistCounts,
    hasMore,
    loadMore,
    needsRefresh,
  } = useSearchResults({ client: meiliClient, username: selectedUsername });

  const {
    playlists,
    loadingPlaylists,
    playlistName,
    setPlaylistName,
    playlist,
    setPlaylist,
    fetchPlaylists,
    handleCreatePlaylist,
    handleLoadPlaylist,
    savePlaylist,
    exportPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    moveTrack,
  } = usePlaylists();

  const [editTrack, setEditTrack] = useState<Track | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const initialFocusRef = useRef<HTMLButtonElement | null>(null);

  const handleEditClick = (track: Track) => {
    setEditTrack(track);
    setDialogOpen(true);
  };

  const handleSaveTrack = async (data: TrackEditFormProps) => {
    const res = await fetch("/api/tracks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setEditTrack(null);
      setDialogOpen(false);
      needsRefresh();
      // Refresh search results after saving track
    } else {
      alert("Failed to update track");
    }
  };

  const totalPlaytimeSeconds = playlist.reduce((sum, track) => {
    if (!track.duration && typeof track.duration_seconds === "number") {
      return sum + track.duration_seconds;
    }
    return sum + parseDurationToSeconds(track.duration);
  }, 0);
  const totalPlaytimeFormatted = formatSeconds(totalPlaytimeSeconds);

  return (
    <>
      <TopMenuBar current="/" />
      <Flex p={4} gap={4} direction="row">
        {/* Playlist Sidebar */}
        <Box
          position="relative"
          width={playlistSidebarMinimized ? "40px" : "300px"}
          minWidth={playlistSidebarMinimized ? "40px" : "300px"}
          transition="width 0.2s"
          mr={2}
        >
          <Button
            aria-label={playlistSidebarMinimized ? "Expand" : "Minimize"}
            size="xs"
            position="absolute"
            top={2}
            right={playlistSidebarMinimized ? 0 : -4}
            zIndex={1}
            onClick={() => setPlaylistSidebarMinimized((m) => !m)}
            variant="ghost"
            px={1}
          >
            {playlistSidebarMinimized ? "▶" : "◀"}
          </Button>
          {!playlistSidebarMinimized && meiliClient && (
            <PlaylistManager
              playlists={playlists}
              loadingPlaylists={loadingPlaylists}
              playlistName={playlistName}
              setPlaylistName={setPlaylistName}
              handleCreatePlaylist={handleCreatePlaylist}
              handleLoadPlaylist={handleLoadPlaylist}
              xmlImportModalOpen={xmlImportModalOpen}
              setXmlImportModalOpen={setXmlImportModalOpen}
              client={meiliClient}
              fetchPlaylists={fetchPlaylists}
            />
          )}
        </Box>

        {/* Search Results */}
        {meiliClient && (
          <SearchResults
            query={query}
            onQueryChange={onQueryChange}
            estimatedResults={estimatedResults}
            activeFilter={activeFilter}
            activeFilterType={activeFilterType}
            clearFilter={clearFilter}
            results={results}
            playlistCounts={playlistCounts}
            addToPlaylist={addToPlaylist}
            handleEditClick={handleEditClick}
            hasMore={hasMore}
            loadMore={loadMore}
            selectedUsername={selectedUsername}
            onUsernameChange={(username) => {
              setSelectedUsername(username);
            }}
          />
        )}

        {/* Playlist Panel */}
        <Box
          borderWidth="1px"
          borderRadius="lg"
          p={4}
          width="40%"
          overflowY="auto"
        >
          <Flex alignItems="center" justifyContent="space-between" mb={3}>
            <Box>
              <Text fontSize="xl" fontWeight="bold">
                Playlist ({hasMounted ? playlist.length : 0})
              </Text>
              <Text fontSize="sm" color="gray.500">
                Total Playtime: {hasMounted ? totalPlaytimeFormatted : "--:--"}
              </Text>
            </Box>
            <Flex gap={2} alignItems="center">
              <Button
                variant="solid"
                size="sm"
                onClick={savePlaylist}
                disabled={!hasMounted || playlist.length === 0}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant={"outline"}
                onClick={exportPlaylist}
                disabled={!hasMounted || playlist.length === 0}
              >
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPlaylist([])}
                disabled={!hasMounted || playlist.length === 0}
              >
                Clear
              </Button>
            </Flex>
          </Flex>
          <PlaylistViewer
            {...usePlaylistViewer({
              playlist,
              playlistCounts,
              moveTrack,
              setEditTrack: handleEditClick,
              removeFromPlaylist,
            })}
          />
        </Box>
      </Flex>

      {/* Dialog replacing Modal */}
      <Dialog.Root
        open={dialogOpen}
        onOpenChange={(details) => setDialogOpen(details.open)}
        initialFocusEl={() => initialFocusRef.current}
        role="dialog"
        size="lg"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Edit Track</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton ref={initialFocusRef} size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                {editTrack && (
                  <TrackEditForm track={editTrack} onSave={handleSaveTrack} />
                )}
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
