"use client";

import React from "react";
import { Box, Flex, Input, Text, Button, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, useToast } from "@chakra-ui/react";
// Example playlist import format:
// {
//   "name": "My Playlist",
//   "tracks": ["track_id1", "track_id2", ...]
// }

import AppleMusicXmlImport from "@/components/AppleMusicXmlImport";

export type Playlist = {
  id: number;
  name: string;
  tracks: string[];
};

type PlaylistManagerProps = {
  playlists: Playlist[];
  loadingPlaylists: boolean;
  playlistName: string;
  setPlaylistName: (name: string) => void;
  handleCreatePlaylist: () => void;
  handleLoadPlaylist: (trackIds: string[]) => void;
  xmlImportModalOpen: boolean;
  setXmlImportModalOpen: (open: boolean) => void;
  client: unknown;
  fetchPlaylists: () => void;
};

const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  loadingPlaylists,
  playlistName,
  setPlaylistName,
  handleCreatePlaylist,
  handleLoadPlaylist,
  xmlImportModalOpen,
  setXmlImportModalOpen,
  client,
  fetchPlaylists,
}) => {
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [playlistToDelete, setPlaylistToDelete] = React.useState<number | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Handler to open dialog
  const handleDeletePlaylist = (id: number) => {
    setPlaylistToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDeletePlaylist = async () => {
    if (playlistToDelete == null) return;
    await fetch(`/api/playlists?id=${playlistToDelete}`, { method: "DELETE" });
    fetchPlaylists();
    setPlaylistToDelete(null);
    setDeleteDialogOpen(false);
  };

  const toast = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Import playlist JSON, supporting both array of tracks and playlist object
  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      console.debug("Importing playlist data:", data);
      let name = "Imported Playlist";
      let tracks: string[] = [];
      if (Array.isArray(data)) {
        // Array of track objects
        tracks = data.map((t) => t.track_id).filter(Boolean);
        name = window.prompt("Enter a name for the imported playlist:", "Imported Playlist") || "Imported Playlist";
        if (!tracks.length) {
          toast({ title: "No valid tracks found in import.", status: "error" });
          return;
        }
      } else if (data && data.name && Array.isArray(data.tracks)) {
        // Playlist object
        name = data.name;
        tracks = data.tracks;
      } else {
        toast({ title: "Invalid playlist format", status: "error" });
        return;
      }
      // Create playlist via API
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tracks }),
      });
      if (res.ok) {
        toast({ title: `Playlist '${name}' imported!`, status: "success" });
        fetchPlaylists();
      } else {
        toast({ title: "Failed to import playlist", status: "error" });
      }
    } catch {
      toast({ title: "Error importing playlist", status: "error" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Box minWidth="220px" mr={4}>
      <Text fontSize={"lg"} fontWeight="bold" mb={4}>
        Playlist Maker Pro Edition
      </Text>
      <Flex mb={2} gap={2}>
        <Input
          size="sm"
          placeholder="New playlist name"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
        />
        <Button
          size="sm"
          colorScheme="blue"
          onClick={handleCreatePlaylist}
          isDisabled={!playlistName.trim()}
        >
          Save
        </Button>
      </Flex>
      <Box
        overflowY="auto"
        borderWidth="1px"
        borderRadius="md"
        p={2}
        bg="gray.50"
      >
        <Box>
          {loadingPlaylists ? (
            <Text fontSize="sm">Loading...</Text>
          ) : playlists.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
              No saved playlists.
            </Text>
          ) : (
            playlists.map((pl: Playlist) => (
              <Flex
                key={pl.id}
                justify="space-between"
                mb={1}
                flexDirection={"column"}
              >
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="bold" isTruncated>
                    {pl.name}
                  </Text>
                </Box>
                <Flex>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    mr={1}
                    onClick={() => handleLoadPlaylist(pl.tracks)}
                  >
                    Load
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="gray"
                    onClick={() => handleDeletePlaylist(pl.id)}
                  >
                    Delete
                  </Button>
                </Flex>
              </Flex>
            ))
          )}
        </Box>
      </Box>
      {/* Playlist Delete Confirmation Dialog */}
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
            <Button
              ref={cancelRef}
              onClick={() => {
                setDeleteDialogOpen(false);
                setPlaylistToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmDeletePlaylist} ml={3}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button
        mt={6}
        colorScheme="purple"
        size="sm"
        width="100%"
        onClick={() => setXmlImportModalOpen(true)}
      >
        Import Apple Music XML
      </Button>
      <Button
        mt={2}
        colorScheme="teal"
        size="sm"
        width="100%"
        onClick={() => fileInputRef.current?.click()}
      >
        Import Playlist JSON
      </Button>
      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImportJson}
      />
      <AppleMusicXmlImport
        isOpen={xmlImportModalOpen}
        onClose={() => setXmlImportModalOpen(false)}
        client={client}
        fetchPlaylists={fetchPlaylists}
      />
    </Box>
  );
};

export default PlaylistManager;
