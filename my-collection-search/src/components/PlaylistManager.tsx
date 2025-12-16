"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DeletePlaylistDialog from "@/components/DeletePlaylistDialog";
import NamePlaylistDialog from "@/components/NamePlaylistDialog";
import FriendSelectDialog from "@/components/FriendSelectDialog";
import {
  Box,
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
  Menu,
} from "@chakra-ui/react";
import { MeiliSearch } from "meilisearch";

import { Toaster, toaster } from "@/components/ui/toaster"; // See below
import AppleMusicXmlImport from "@/components/AppleMusicXmlImport";
import { FiHeadphones, FiTrash, FiMoreVertical } from "react-icons/fi";
import { TbFileImport } from "react-icons/tb";
import { usePlaylists } from "@/providers/PlaylistsProvider";
import { importPlaylist, PlaylistTrackPayload } from "@/services/playlistService";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { FaPlay } from "react-icons/fa";
import { fetchTracksByIds } from "@/services/trackService";
import { formatDateWithRelative } from "@/lib/date";

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
  const { playlists, loadingPlaylists, fetchPlaylists } = usePlaylists();

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

  // State for friend selection dialog
  const [friendSelectDialogOpen, setFriendSelectDialogOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    name: string;
    tracks: Array<PlaylistTrackPayload>;
  } | null>(null);

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
      let tracksData: Array<PlaylistTrackPayload> = [];

      // Parse different JSON formats
      if (Array.isArray(data)) {
        tracksData = data.filter((t) => t.track_id);
      } else if (data.tracks && Array.isArray(data.tracks)) {
        if (data.name) name = data.name;
        tracksData = data.tracks.filter((t: PlaylistTrackPayload) => t.track_id);
      } else {
        throw new Error("Invalid playlist format");
      }

      if (!tracksData.length) throw new Error("No valid tracks found");

      // Fetch friends to resolve usernames
      const friendsRes = await fetch("/api/friends");
      const friendsData = await friendsRes.json();
      const friends = friendsData.results || [];

      // Check if we can resolve all usernames to friend_ids
      const hasUsernames = tracksData.some((t) => t.username);
      const canResolveAll = hasUsernames && tracksData.every((t) =>
        !t.username || friends.some((f: { username: string }) => f.username === t.username)
      );

      if (!hasUsernames || !canResolveAll) {
        // Need user to select a friend - show friend selection dialog
        setPendingImport({ name, tracks: tracksData });
        setFriendSelectDialogOpen(true);
        return;
      }

      // Resolve usernames to friend_ids
      const friendMap = new Map(friends.map((f: { id: number; username: string }) => [f.username, f.id]));
      const tracks = tracksData.map((t) => ({
        ...t,
        friend_id: t.username ? friendMap.get(t.username) : undefined,
      })).filter((t) => t.friend_id);

      if (!tracks.length) {
        notify({ title: "Could not resolve any tracks to friends", type: "error" });
        return;
      }

      // Import directly
      const res = await importPlaylist(name, tracks);
      if (res.ok) {
        notify({ title: `Imported '${name}'`, type: "success" });
        fetchPlaylists();
      } else {
        notify({ title: "Failed to import playlist", type: "error" });
      }
    } catch (err) {
      console.error("Import error:", err);
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

  // Handler for friend selection confirmation
  const handleFriendSelectConfirm = async () => {
    if (!pendingImport || !selectedFriendId) return;

    try {
      const tracks = pendingImport.tracks.map((t) => ({
        ...t,
        friend_id: selectedFriendId,
      }));

      const res = await importPlaylist(pendingImport.name, tracks);
      if (res.ok) {
        notify({ title: `Imported '${pendingImport.name}'`, type: "success" });
        fetchPlaylists();
      } else {
        notify({ title: "Failed to import playlist", type: "error" });
      }
    } catch {
      notify({ title: "Error importing playlist", type: "error" });
    } finally {
      setFriendSelectDialogOpen(false);
      setPendingImport(null);
      setSelectedFriendId(null);
    }
  };

  return (
    <Box minW="240px">
      {/* Header + filter */}
      <VStack align="stretch" mb={2} gap={2}>
        <HStack justify="space-between">
          <Text fontWeight="bold">Playlists</Text>
          <HStack gap={2}>
            {playlists.length > 0 && (
              <Badge colorPalette="gray" variant="surface">
                {playlists.length}
              </Badge>
            )}
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button size="xs" variant="outline">
                  <TbFileImport /> Import
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    value="import-apple-xml"
                    onClick={() => setXmlImportModalOpen(true)}
                  >
                    <TbFileImport /> Import Apple XML
                  </Menu.Item>
                  <Menu.Item
                    value="import-json"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <TbFileImport /> Import JSON
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          </HStack>
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
              <Box
                key={pl.id}
                w="100%"
                textAlign="left"
                px={[0, 2]}
                py={2}
                borderRadius="md"
                _hover={{ bg: "bg.muted" }}
                _active={{ bg: "bg.subtle" }}
              >
                <HStack justify="space-between" align="center" gap={3}>
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={3}
                    minW={0}
                    cursor="pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/playlists/${pl.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') router.push(`/playlists/${pl.id}`);
                    }}
                  >
                    <Box
                      boxSize="7"
                      rounded="sm"
                      bg="blue.500"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="fg.muted"
                      flexShrink={0}
                    />
                    <VStack align="start" gap={0} minW={0}>
                      <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
                        {pl.name}
                      </Text>
                      <HStack gap={2} color="fg.muted" fontSize="xs">
                        <Text>{formatDateWithRelative(pl.created_at)}</Text>
                        <Text>• {pl.tracks.length} tracks</Text>
                      </HStack>
                    </VStack>
                  </Box>

                  <HStack gap={1} flexShrink={0}>
                    {isRowLoading && <Spinner size="xs" />}
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <Button
                          size="xs"
                          variant="ghost"
                          px={2}
                          aria-label="Playlist actions"
                        >
                          <FiMoreVertical />
                        </Button>
                      </Menu.Trigger>
                      <Menu.Positioner>
                        <Menu.Content>
                          <Menu.Item
                            value="play-now"
                            onClick={async () => {
                              const tracks = await fetchTracksByIds(pl.tracks);
                              replacePlaylist(tracks, { autoplay: true, startIndex: 0 });
                            }}
                          >
                            <FaPlay /> Play now
                          </Menu.Item>
                          <Menu.Item
                            value="delete"
                            onClick={() =>
                              setDeleteDialogState({ open: true, playlistId: pl.id })
                            }
                            color="fg.error"
                            _hover={{ bg: "bg.error", color: "fg.error" }}
                          >
                            <FiTrash /> Delete
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Menu.Root>
                  </HStack>
                </HStack>
              </Box>
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
      <AppleMusicXmlImport
        isOpen={xmlImportModalOpen}
        onClose={() => setXmlImportModalOpen(false)}
        client={client}
        fetchPlaylists={fetchPlaylists}
      />
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
      <FriendSelectDialog
        open={friendSelectDialogOpen}
        selectedFriendId={selectedFriendId}
        setSelectedFriendId={setSelectedFriendId}
        trackCount={pendingImport?.tracks.length}
        onConfirm={handleFriendSelectConfirm}
        onCancel={() => {
          setFriendSelectDialogOpen(false);
          setPendingImport(null);
          setSelectedFriendId(null);
        }}
      />
    </Box>
  );
}
