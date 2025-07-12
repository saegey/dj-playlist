"use client";

import { MeiliSearch } from "meilisearch";
import {
  Box,
  Flex,
  Text,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import PlaylistViewer from "@/components/PlaylistViewer";
import { usePlaylistViewer } from "@/hooks/usePlaylistViewer";

import dynamic from "next/dynamic";
import SearchResults from "@/components/SearchResults";
import { useState, useMemo } from "react";
import { useSearchResults } from "@/hooks/useSearchResults";
import { usePlaylists } from "@/hooks/usePlaylists";
import PlaylistManager from "@/components/PlaylistManager";

const TrackEditForm = dynamic(() => import("../components/TrackEditForm"), {
  ssr: false,
});

import type { Track } from "@/types/track";

import { parseDurationToSeconds, formatSeconds } from "@/lib/trackUtils";
import React from "react";

export default function SearchPage() {
  const [playlistSidebarMinimized, setPlaylistSidebarMinimized] =
    useState(false);
  const [xmlImportModalOpen, setXmlImportModalOpen] = useState(false);
  // Search results state/logic now handled by useSearchResults
  const client = useMemo(
    () =>
      new MeiliSearch({
        host: "http://127.0.0.1:7700",
        apiKey: "masterKey",
      }),
    []
  );
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
  } = useSearchResults({ client, username: selectedUsername });

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
  const { onOpen, onClose } = useDisclosure();

  // Delete handler for dialog (still local, but can be passed to SearchResults)
  const handleEditClick = (track: Track) => {
    setEditTrack(track);
    onOpen();
  };

  const handleSaveTrack = async (data: Track) => {
    const res = await fetch("/api/tracks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      // Refresh search results after update
      // After saving, just close the modal and let the search hook handle refresh
      setEditTrack(null);
      onClose();
    } else {
      alert("Failed to update track");
    }
  };

  // (addToPlaylist and removeFromPlaylist are now only from the hook)

  const totalPlaytimeSeconds = playlist.reduce((sum, track) => {
    if (!track.duration) {
      return (
        sum +
        (typeof track.duration_seconds === "number"
          ? track.duration_seconds
          : 0)
      );
    }
    return sum + parseDurationToSeconds(track.duration);
  }, 0);

  const totalPlaytimeFormatted = formatSeconds(totalPlaytimeSeconds);

  return (
    <>
      <Flex p={4} gap={4} direction="row">
        {/* Playlist Management Section */}
        {/* Minimizable PlaylistManager sidebar */}
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
          {!playlistSidebarMinimized && (
            <PlaylistManager
              playlists={playlists}
              loadingPlaylists={loadingPlaylists}
              playlistName={playlistName}
              setPlaylistName={setPlaylistName}
              handleCreatePlaylist={handleCreatePlaylist}
              handleLoadPlaylist={handleLoadPlaylist}
              xmlImportModalOpen={xmlImportModalOpen}
              setXmlImportModalOpen={setXmlImportModalOpen}
              client={client}
              fetchPlaylists={fetchPlaylists}
            />
          )}
        </Box>
        {/* Search Results Section */}
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
          usernames={['saegey', 'Cdsmooth']}
          selectedUsername={selectedUsername}
          onUsernameChange={(username) => {
            setSelectedUsername(username);
            // Optionally reset query or filters here if desired
          }}
        />
        <Box
          borderWidth="2px"
          borderRadius="lg"
          p={4}
          width="40%"
          overflowY="auto"
        >
          <Flex alignItems="center" justifyContent="space-between" mb={3}>
            <Box>
              <Text fontSize="xl" fontWeight="bold">
                Playlist ({playlist.length})
              </Text>
              <Text fontSize="sm" color="gray.500">
                Total Playtime: {totalPlaytimeFormatted}
              </Text>
            </Box>
            <Flex gap={2} alignItems="center">
              <Button
                colorScheme="blue"
                size="sm"
                onClick={savePlaylist}
                isDisabled={playlist.length === 0}
              >
                Save
              </Button>
              <Button
                colorScheme="gray"
                size="sm"
                onClick={exportPlaylist}
                isDisabled={playlist.length === 0}
              >
                Export
              </Button>
              <Button
                colorScheme="red"
                size="sm"
                onClick={() => setPlaylist([])}
                isDisabled={playlist.length === 0}
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
              setEditTrack,
              removeFromPlaylist,
            })}
          />
        </Box>
      </Flex>
      <Modal
        isOpen={!!editTrack}
        onClose={() => {
          setEditTrack(null);
          onClose();
        }}
        size={"2xl"}
      >
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg="white">
          <ModalHeader>Edit Track</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editTrack && (
              <TrackEditForm track={editTrack} onSave={handleSaveTrack} />
            )}
          </ModalBody>
          {/* <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant='ghost'>Secondary Action</Button>
          </ModalFooter> */}
        </ModalContent>
      </Modal>
    </>
  );
}
