"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  Input,
  Badge,
  Spinner,
  Separator,
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
  const router = useRouter();
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

  // Simple filter for playlists
  const [filter, setFilter] = useState("");
  const filtered = React.useMemo(() => {
    if (!filter.trim()) return playlists;
    const q = filter.toLowerCase();
    return playlists.filter((pl) => pl.name.toLowerCase().includes(q));
  }, [playlists, filter]);

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
    <Box minW="240px">
      {/* Header + filter */}
      <VStack align="stretch" mb={2} gap={2}>
        <HStack justify="space-between">
          <Text fontWeight="bold">Playlists</Text>
          {playlists.length > 0 && (
            <Badge colorPalette="gray" variant="surface">
              {playlists.length}
            </Badge>
          )}
        </HStack>
        <Input
          size="sm"
          placeholder="Filter playlists..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </VStack>

      <Stack
        overflowY="auto"
        borderWidth={[0, "1px"]}
        borderRadius="md"
        p={[0, 2]}
        bg={["bg", "bg.subtle"]}
        separator={
          <Separator orientation="horizontal" borderColor="bg.muted" />
        }
      >
        {playlists.length === 0 && !loadingPlaylists ? (
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
                <HStack>
                  <Button
                    size="xs"
                    variant="surface"
                    onClick={() => setXmlImportModalOpen(true)}
                  >
                    Import Apple XML
                  </Button>
                  <Button
                    size="xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Import JSON
                  </Button>
                </HStack>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : filtered.length === 0 ? (
          <Text fontSize="sm" color="fg.muted" px={2} py={1}>
            {`No playlists match "${filter}"`}
          </Text>
        ) : (
          filtered.map((pl) => {
            const isRowLoading =
              typeof loadingPlaylists === "object" &&
              loadingPlaylists !== null &&
              pl.id === loadingPlaylists.id;
            return (
              <Flex
                key={pl.id}
                direction="row"
                alignItems="center"
                gap={2}
                px={[0, 2]}
                py={1}
                borderRadius="md"
                _hover={{ bg: "bg.muted" }}
              >
                <Box
                  flex="1"
                  minW={0}
                  cursor="pointer"
                  onClick={async () => {
                    // await handleLoadPlaylist(pl.tracks, pl.id);
                    notify({ title: "Playlist loaded.", type: "success" });
                    router.push(`/playlists/${pl.id}`);
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      // await handleLoadPlaylist(pl.tracks, pl.id);
                      notify({ title: "Playlist loaded.", type: "success" });
                      router.push(`/playlists/${pl.id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title={pl.name}
                >
                  <HStack gap={2} align="center">
                    <Text fontSize="sm" fontWeight="bold" lineClamp={1}>
                      {pl.name}
                    </Text>
                    <Badge colorPalette="gray" variant="solid">
                      {pl.tracks.length}
                    </Badge>
                    {isRowLoading && <Spinner size="xs" />}
                  </HStack>
                </Box>
                <HStack gap={2}>
                  <Button
                    aria-label="Play now"
                    size="xs"
                    colorPalette={"primary"}
                    variant={"surface"}
                    onClick={async (e) => {
                      e.stopPropagation();
                      const tracks = await fetchTracksByIds(pl.tracks);
                      replacePlaylist(tracks, {
                        autoplay: true,
                        startIndex: 0,
                      });
                    }}
                  >
                    <FaPlay />
                  </Button>

                  <Button
                    aria-label="Load into editor"
                    size="xs"
                    variant="solid"
                    colorPalette="primary"
                    disabled={isRowLoading}
                    loading={isRowLoading}
                    mr={1}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleLoadPlaylist(pl.tracks, pl.id);
                      notify({
                        title: "Playlist loaded.",
                        type: "success",
                      });
                    }}
                  >
                    <FiBookOpen />
                  </Button>

                  <Button
                    aria-label="Delete playlist"
                    size="xs"
                    colorPalette={"red"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogState({
                        open: true,
                        playlistId: pl.id,
                      });
                    }}
                  >
                    <FiTrash />
                  </Button>
                </HStack>
              </Flex>
            );
          })
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
