"use client";

import React, { useRef, useState } from "react";
import {
  Box,
  Flex,
  Input,
  Text,
  Button,
  Dialog,
  Portal,
  CloseButton,
  Stack,
} from "@chakra-ui/react";
import { MeiliSearch } from "meilisearch";

import { Toaster, toaster } from "@/components/ui/toaster"; // See below
import AppleMusicXmlImport from "@/components/AppleMusicXmlImport";

export type Playlist = { id: number; name: string; tracks: string[] };

type Props = {
  playlists: Playlist[];
  loadingPlaylists: boolean;
  playlistName: string;
  setPlaylistName: (name: string) => void;
  handleCreatePlaylist: () => void;
  handleLoadPlaylist: (trackIds: string[]) => void;
  xmlImportModalOpen: boolean;
  setXmlImportModalOpen: (open: boolean) => void;
  client: MeiliSearch;
  fetchPlaylists: () => void;
};

export default function PlaylistManager({
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
}: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<number | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (opts: Parameters<typeof toaster.create>[0]) =>
    toaster.create(opts);

  const confirmDeletePlaylist = async () => {
    if (playlistToDelete == null) return;
    try {
      await fetch(`/api/playlists?id=${playlistToDelete}`, {
        method: "DELETE",
      });
      notify({ title: "Playlist deleted.", type: "success" });
      fetchPlaylists();
    } catch {
      notify({ title: "Failed to delete playlist.", type: "error" });
    } finally {
      setDeleteDialogOpen(false);
      setPlaylistToDelete(null);
    }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = JSON.parse(await file.text());
      let name = "Imported Playlist";
      let tracks: string[] = [];

      if (Array.isArray(data)) {
        tracks = data.map((t) => t.track_id).filter(Boolean);
        if (!tracks.length) throw new Error("No valid tracks");
        name = window.prompt("Name your playlist:", name) || name;
      } else if (data.name && Array.isArray(data.tracks)) {
        ({ name, tracks } = data);
      } else {
        throw new Error("Invalid playlist format");
      }

      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tracks }),
      });

      if (res.ok) {
        notify({ title: `Imported '${name}'`, type: "success" });
        fetchPlaylists();
      } else {
        notify({ title: "Failed to import playlist", type: "error" });
      }
    } catch {
      notify({ title: "Error importing playlist", type: "error" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Box minW="220px" mr={4}>
      <Flex mb={2} gap={2}>
        <Input
          size="sm"
          placeholder="New playlist name"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
        />
        <Button
          size="sm"
          variant={"solid"}
          disabled={!playlistName.trim()}
          onClick={handleCreatePlaylist}
        >
          Save
        </Button>
      </Flex>

      <Stack
        overflowY="auto"
        borderWidth="1px"
        borderRadius="md"
        p={2}
        bg="bg.subtle"
        separator={<Box borderBottomWidth="1px" borderColor="bg.emphasis" />}
      >
        {loadingPlaylists ? (
          <Text fontSize="sm">Loading...</Text>
        ) : playlists.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            No saved playlists.
          </Text>
        ) : (
          playlists.map((pl) => (
            <Flex key={pl.id} direction="column" mb={2}>
              <Text fontSize="sm" fontWeight="bold">
                {pl.name}
              </Text>
              <Flex mt={1}>
                <Button
                  size="xs"
                  variant="solid"
                  colorScheme="primary"
                  mr={1}
                  onClick={() => handleLoadPlaylist(pl.tracks)}
                >
                  Load
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => {
                    setPlaylistToDelete(pl.id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  Delete
                </Button>
              </Flex>
            </Flex>
          ))
        )}
      </Stack>

      <Dialog.Root
        open={deleteDialogOpen}
        onOpenChange={(details) => {
          setDeleteDialogOpen(details.open);
          if (!details.open) setPlaylistToDelete(null);
        }}
        role="alertdialog"
        initialFocusEl={() => cancelRef.current}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Delete Playlist</Dialog.Title>

                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    ref={cancelRef}
                    size="sm"
                    onClick={() => setDeleteDialogOpen(false)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                Are you sure? This action cannot be undone.
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  colorPalette="red"
                  ml={3}
                  onClick={confirmDeletePlaylist}
                >
                  Delete
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      <Button
        mt={6}
        variant="surface"
        size="sm"
        width="100%"
        onClick={() => setXmlImportModalOpen(true)}
      >
        Import Apple Music XML
      </Button>
      <Button
        mt={2}
        variant="solid"
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

      <Toaster />
    </Box>
  );
}
