"use client";

import { MeiliSearch } from "meilisearch";
import {
  Box,
  Flex,
  Input,
  Text,
  Button,
  useDisclosure,
  MenuItem,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button as ChakraButton,
} from "@chakra-ui/react";
import { FiArrowDown, FiArrowUp, FiEdit, FiTrash2 } from "react-icons/fi";

import dynamic from "next/dynamic";
import TrackResult from "@/components/TrackResult";
import { useState, useCallback, useEffect, useMemo, ChangeEvent } from "react";
import { usePlaylists } from "@/hooks/usePlaylists";
import PlaylistManager from "@/components/PlaylistManager";

const TrackEditForm = dynamic(() => import("../components/TrackEditForm"), {
  ssr: false,
});

import type { Track } from "@/types/track";

import { parseDurationToSeconds, formatSeconds } from "@/lib/trackUtils";
import React from "react";

export default function SearchPage() {
  // --- Apple Music XML Import Modal State ---
  const [xmlImportModalOpen, setXmlImportModalOpen] = useState(false);
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Track[]>([]);

  // --- Playlist state/logic via usePlaylists hook ---
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

  // Filter state
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeFilterType, setActiveFilterType] = useState<
    "genre" | "style" | "artist" | null
  >(null);

  // Holds playlist counts for current results
  // Use Record<string, number> for type safety and clarity
  const [playlistCounts, setPlaylistCounts] = useState<Record<string, number>>(
    {}
  );

  // Pagination and search state
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [estimatedResults, setEstimatedResults] = useState<number>(0);
  const limit = 20;

  // Helper to fetch playlist counts for a list of track IDs
  const fetchPlaylistCounts = useCallback(async (trackIds: string[]) => {
    if (!trackIds || trackIds.length === 0) return;
    try {
      const res = await fetch("/api/tracks/playlist_counts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_ids: trackIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylistCounts((prev) => ({ ...prev, ...data }));
      }
    } catch (e) {
      // Ignore errors for now
    }
  }, []);

  // Delete dialog state (kept local, not in hook)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<number | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Delete handler for dialog
  const handleDeletePlaylistWithDialog = (id: number) => {
    setPlaylistToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePlaylist = async () => {
    if (playlistToDelete == null) return;
    // Use API directly, then refresh
    await fetch(`/api/playlists?id=${playlistToDelete}`, { method: "DELETE" });
    fetchPlaylists();
    setPlaylistToDelete(null);
    setDeleteDialogOpen(false);
  };
  // ...existing code...

  // Render AlertDialog in the return block so it is part of the React tree


  const handleEditClick = (track: Track) => {
    setEditTrack(track);
    onOpen();
  };

  const handleSaveTrack = async (data: any) => {
    const res = await fetch("/api/tracks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      // Refresh search results after update
      const index = client.index<Track>("tracks");
      let refreshed;
      if (query) {
        refreshed = await index.search(query, { limit, offset: 0 });
      } else {
        const stats = await index.getStats();
        const total = stats.numberOfDocuments || 0;
        const randomOffset =
          total > 10 ? Math.floor(Math.random() * (total - 10)) : 0;
        refreshed = await index.search("", { limit: 10, offset: randomOffset });
      }
      setResults(refreshed.hits);
      setEditTrack(null);
      onClose();
    } else {
      alert("Failed to update track");
    }
  };

  // Memoize MeiliSearch client
  const client = useMemo(
    () =>
      new MeiliSearch({
        host: "http://127.0.0.1:7700",
        apiKey: "masterKey",
      }),
    []
  );

  // Show recommended tracks on page load (random or trending)
  useEffect(() => {
    if (!query) {
      // Show 10 random tracks as recommendations
      (async () => {
        const index = client.index<Track>("tracks");
        // Use a blank query and a random offset for variety
        const stats = await index.getStats();
        const total = stats.numberOfDocuments || 0;
        const randomOffset =
          total > 10 ? Math.floor(Math.random() * (total - 10)) : 0;
        const res = await index.search("", { limit: 10, offset: randomOffset });
        setResults(res.hits);
        setEstimatedResults(total);
        setOffset(10);
        setHasMore(total > 10);
        // Fetch playlist counts for these tracks
        fetchPlaylistCounts(res.hits.map((t) => t.track_id));
      })();
      return;
    }
    const search = async () => {
      const index = client.index<Track>("tracks");
      const res = await index.search(query, { limit, offset: 0 });
      setResults(res.hits);
      setOffset(limit);
      setHasMore(res.hits.length === limit);
      setEstimatedResults(res.estimatedTotalHits || 0);
      // Fetch playlist counts for these tracks
      fetchPlaylistCounts(res.hits.map((t) => t.track_id));
    };
    search();
  }, [query, fetchPlaylistCounts, client]);

  // Clear filter
  const clearFilter = () => {
    setActiveFilter(null);
    setActiveFilterType(null);
    setQuery("");
    setOffset(0);
    setHasMore(false);
    // Show recommendations again
    (async () => {
      const index = client.index<Track>("tracks");
      const stats = await index.getStats();
      const total = stats.numberOfDocuments || 0;
      const randomOffset =
        total > 10 ? Math.floor(Math.random() * (total - 10)) : 0;
      const res = await index.search("", { limit: 10, offset: randomOffset });
      setResults(res.hits);
      setEstimatedResults(total);
      setOffset(10);
      setHasMore(total > 10);
    })();
  };

  const loadMore = async () => {
    const index = client.index<Track>("tracks");
    let res;
    if (activeFilter && activeFilterType) {
      let filter;
      if (activeFilterType === "genre")
        filter = [`genres = \"${activeFilter}\"`];
      else if (activeFilterType === "style")
        filter = [`styles = \"${activeFilter}\"`];
      else if (activeFilterType === "artist")
        filter = [`artist = \"${activeFilter}\"`];
      res = await index.search("", { filter, limit, offset });
    } else {
      res = await index.search(query, { limit, offset });
    }
    setResults((prev) => {
      // Fetch playlist counts for new tracks only
      const newTracks = res.hits.filter((t) => !(t.track_id in playlistCounts));
      if (newTracks.length > 0)
        fetchPlaylistCounts(newTracks.map((t) => t.track_id));
      return [...prev, ...res.hits];
    });
    setOffset(offset + limit);
    setHasMore(res.hits.length === limit);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
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
      <AlertDialog
        isOpen={deleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          setDeleteDialogOpen(false);
          setPlaylistToDelete(null);
        }}
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Delete Playlist
          </AlertDialogHeader>
          <AlertDialogBody>
            Are you sure you want to delete this playlist? This action cannot be undone.
          </AlertDialogBody>
          <AlertDialogFooter>
            <ChakraButton
              ref={cancelRef}
              onClick={() => {
                setDeleteDialogOpen(false);
                setPlaylistToDelete(null);
              }}
            >
              Cancel
            </ChakraButton>
            <ChakraButton colorScheme="red" onClick={confirmDeletePlaylist} ml={3}>
              Delete
            </ChakraButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Flex p={4} gap={4} direction="row">
        {/* Playlist Management Section */}
        <PlaylistManager
          playlists={playlists}
          loadingPlaylists={loadingPlaylists}
          playlistName={playlistName}
          setPlaylistName={setPlaylistName}
          handleCreatePlaylist={handleCreatePlaylist}
          handleLoadPlaylist={handleLoadPlaylist}
          handleDeletePlaylist={handleDeletePlaylistWithDialog}
          xmlImportModalOpen={xmlImportModalOpen}
          setXmlImportModalOpen={setXmlImportModalOpen}
          client={client}
          fetchPlaylists={fetchPlaylists}
        />
        <Box width="40%">
          <Input
            type="text"
            placeholder="Search tracks..."
            value={query}
            onChange={handleInputChange}
            width="100%"
            mb={3}
          />
          <Text fontSize="sm" color="gray.500" mb={2}>
            {estimatedResults.toLocaleString()} results found
            {activeFilter && activeFilterType && (
              <>
                <Text as="span" color="purple.600" ml={2}>
                  Filtered by{" "}
                  {activeFilterType.charAt(0).toUpperCase() +
                    activeFilterType.slice(1)}
                  : <b>{activeFilter}</b>
                </Text>
                <Button
                  size="xs"
                  ml={2}
                  onClick={clearFilter}
                  colorScheme="gray"
                  variant="outline"
                >
                  Clear Filter
                </Button>
              </>
            )}
          </Text>
          {results.map((track) => (
            <TrackResult
              key={track.track_id}
              track={track}
              allowMinimize={false}
              playlistCount={playlistCounts[track.track_id]}
              buttons={[
                <MenuItem
                  key="add"
                  onClick={() => addToPlaylist(track)}
                  color="#3182ce"
                >
                  Add to Playlist
                </MenuItem>,
                <MenuItem
                  key="edit"
                  onClick={() => handleEditClick(track)}
                  color="#4A5568"
                >
                  Edit Track
                </MenuItem>,
              ]}
            />
          ))}

          {hasMore && (
            <Box textAlign="center" mt={4}>
              <Button onClick={loadMore}>Load More</Button>
            </Box>
          )}
        </Box>
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
          {playlist.length === 0 ? (
            <Text color="gray.500">No tracks in playlist yet.</Text>
          ) : (
            playlist.map((track, idx) => (
              <TrackResult
                key={track.track_id}
                track={track}
                minimized
                playlistCount={playlistCounts[track.track_id]}
                buttons={[
                  <MenuItem
                    key="up"
                    onClick={() => moveTrack(idx, idx - 1)}
                    disabled={idx === 0}
                    icon={<Icon as={FiArrowUp} color="#3182ce" boxSize={4} />}
                    color="#3182ce"
                  >
                    Move Up
                  </MenuItem>,
                  <MenuItem
                    key="down"
                    onClick={() => moveTrack(idx, idx + 1)}
                    disabled={idx === playlist.length - 1}
                    icon={<Icon as={FiArrowDown} color="#4A5568" boxSize={4} />}
                    color="#4A5568"
                  >
                    Move Down
                  </MenuItem>,
                  <MenuItem
                    key="edit"
                    onClick={() => setEditTrack(track)}
                    icon={<Icon as={FiEdit} color="black" boxSize={4} />}
                    color="black"
                  >
                    Edit
                  </MenuItem>,
                  <MenuItem
                    key="remove"
                    onClick={() => removeFromPlaylist(track.track_id)}
                    icon={<Icon as={FiTrash2} color="red.500" boxSize={4} />}
                    color="red.500"
                  >
                    Remove
                  </MenuItem>,
                ]}
              />
            ))
          )}
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
