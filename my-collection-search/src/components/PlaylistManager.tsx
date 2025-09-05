"use client";

import React, { useRef, useState } from "react";
import DeletePlaylistDialog from "@/components/DeletePlaylistDialog";
import NamePlaylistDialog from "@/components/NamePlaylistDialog";
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  EmptyState,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { MeiliSearch } from "meilisearch";

import { Toaster, toaster } from "@/components/ui/toaster"; // See below
import AppleMusicXmlImport from "@/components/AppleMusicXmlImport";
import { FiBookOpen, FiHeadphones, FiTrash } from "react-icons/fi";
import { TbFileImport } from "react-icons/tb";
import { usePlaylists } from "@/hooks/usePlaylists";
import { importPlaylist } from "@/services/playlistService";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { FaPlay } from "react-icons/fa";
import { fetchTracksByIds } from "@/services/trackService";

type Props = {
  xmlImportModalOpen: boolean;
  setXmlImportModalOpen: (open: boolean) => void;
  client: MeiliSearch | null;
};

export default function PlaylistManager({
  xmlImportModalOpen,
  setXmlImportModalOpen,
  client,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { playlists, loadingPlaylists, fetchPlaylists, handleLoadPlaylist } =
    usePlaylists();

  const { replacePlaylist } = usePlaylistPlayer();

  const notify = (opts: Parameters<typeof toaster.create>[0]) =>
    toaster.create(opts);

  // Delete dialog state and handler moved to DeletePlaylistDialog below
  const [deleteDialogState, setDeleteDialogState] = useState<{
    open: boolean;
    playlistId: number | null;
  }>({ open: false, playlistId: null });

  // State for import playlist dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importedTracks, setImportedTracks] = useState<string[]>([]);
  const [importedName, setImportedName] = useState("Imported Playlist");

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
        setImportedName(name);
        setImportedTracks(tracks);
        setImportDialogOpen(true);
        return;
      } else if (data.name && Array.isArray(data.tracks)) {
        ({ name, tracks } = data);
        // Directly import if name and tracks present
      } else {
        throw new Error("Invalid playlist format");
      }

      const res = await importPlaylist(name, tracks);

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

  // Handler for confirming import with name
  const handleConfirmImport = async () => {
    if (!importedTracks.length || !importedName.trim()) return;
    try {
      const res = await importPlaylist(importedName, importedTracks);
      if (res.ok) {
        notify({ title: `Imported '${importedName}'`, type: "success" });
        fetchPlaylists();
      } else {
        notify({ title: "Failed to import playlist", type: "error" });
      }
    } catch {
      notify({ title: "Error importing playlist", type: "error" });
    } finally {
      setImportDialogOpen(false);
      setImportedTracks([]);
      setImportedName("Imported Playlist");
    }
  };

  return (
    <Box minW="220px" mr={4}>
      <Stack
        overflowY="auto"
        borderWidth="1px"
        borderRadius="md"
        p={2}
        bg="bg.subtle"
        separator={<Box borderBottomWidth="1px" borderColor="bg.emphasis" />}
      >
        {playlists.length === 0 ? (
          <EmptyState.Root size={"sm"}>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FiHeadphones />
              </EmptyState.Indicator>
              <VStack textAlign="center">
                <EmptyState.Title>No saved playlists</EmptyState.Title>
                <EmptyState.Description>
                  Save your playlists to access them here.
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          playlists.map((pl) => (
            <Flex key={pl.id} direction="row" mb={2} alignItems="center">
              <Text fontSize="sm" fontWeight="bold">
                {pl.name}
              </Text>
              <Flex mt={1} ml="auto" gap={1}>
                <Button
                  size="xs"
                  colorPalette={"primary"}
                  variant={"surface"}
                  onClick={async () => {
                    const tracks = await fetchTracksByIds(pl.tracks);
                    replacePlaylist(tracks, { autoplay: true, startIndex: 0 });
                  }}
                >
                  <FaPlay />
                </Button>
                <Button
                  size="xs"
                  variant="solid"
                  colorPalette="primary"
                  disabled={
                    typeof loadingPlaylists === "object" &&
                    loadingPlaylists !== null &&
                    pl.id === loadingPlaylists.id
                  }
                  loading={
                    typeof loadingPlaylists === "object" &&
                    loadingPlaylists !== null &&
                    pl.id === loadingPlaylists.id
                  }
                  mr={1}
                  onClick={async () => {
                    await handleLoadPlaylist(pl.tracks, pl.id);
                    notify({ title: "Playlist loaded.", type: "success" });
                    console.log(loadingPlaylists);
                  }}
                >
                  <FiBookOpen />
                </Button>
                <Button
                  size="xs"
                  colorPalette={"red"}
                  onClick={() =>
                    setDeleteDialogState({ open: true, playlistId: pl.id })
                  }
                >
                  <FiTrash />
                </Button>
              </Flex>
            </Flex>
          ))
        )}
      </Stack>
      <DeletePlaylistDialog
        open={deleteDialogState.open}
        playlistId={deleteDialogState.playlistId}
        onClose={() => setDeleteDialogState({ open: false, playlistId: null })}
        fetchPlaylists={fetchPlaylists}
        notify={notify}
      />
      <HStack mt={4} gap={4}>
        <Button
          variant="surface"
          size="sm"
          onClick={() => setXmlImportModalOpen(true)}
        >
          <TbFileImport /> Apple Music XML
        </Button>
        <Button
          variant="solid"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <TbFileImport /> Playlist JSON
        </Button>

        <AppleMusicXmlImport
          isOpen={xmlImportModalOpen}
          onClose={() => setXmlImportModalOpen(false)}
          client={client}
          fetchPlaylists={fetchPlaylists}
        />
      </HStack>
      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImportJson}
      />
      <Toaster />
      <NamePlaylistDialog
        open={importDialogOpen}
        name={importedName}
        setName={setImportedName}
        trackCount={importedTracks.length}
        onConfirm={handleConfirmImport}
        onCancel={() => setImportDialogOpen(false)}
        confirmLabel="Import"
      />
    </Box>
  );
}
