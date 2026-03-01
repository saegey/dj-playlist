"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DeletePlaylistDialog from "@/components/DeletePlaylistDialog";
import NamePlaylistDialog from "@/components/NamePlaylistDialog";
import FriendSelectDialog from "@/components/FriendSelectDialog";
import UnifiedSearchControls from "@/components/search/UnifiedSearchControls";
import {
  Box,
  Text,
  Button,
  Stack,
  EmptyState,
  VStack,
  HStack,
  Badge,
  Spinner,
  Separator,
  Menu,
} from "@chakra-ui/react";

import { Toaster, toaster } from "@/components/ui/toaster"; // See below
import AppleMusicXmlImport from "@/components/AppleMusicXmlImport";
import { FiHeadphones, FiTrash, FiMoreVertical } from "react-icons/fi";
import { TbFileImport } from "react-icons/tb";
import { usePlaylists } from "@/providers/PlaylistsProvider";
import { importPlaylist, PlaylistTrackPayload } from "@/services/internalApi/playlists";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { FaPlay } from "react-icons/fa";
import { fetchTracksByIds } from "@/services/trackService";
import { formatDateWithRelative } from "@/lib/date";
import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import { useUsername } from "@/providers/UsernameProvider";
import posthog from "posthog-js";

type Props = {
  xmlImportModalOpen: boolean;
  setXmlImportModalOpen: (open: boolean) => void;
};

export default function PlaylistManager({
  xmlImportModalOpen,
  setXmlImportModalOpen,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { playlists, loadingPlaylists, fetchPlaylists } = usePlaylists();
  const { friend: currentUserFriend } = useUsername();
  const { friends } = useFriendsQuery({
    showCurrentUser: true,
  });

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
  const [selectedLibraryFriendId, setSelectedLibraryFriendId] = useState<
    number | null
  >(null);
  const selectedFriend = React.useMemo(() => {
    if (!selectedLibraryFriendId) return null;
    return friends.find((f) => f.id === selectedLibraryFriendId) || null;
  }, [selectedLibraryFriendId, friends]);

  React.useEffect(() => {
    if (selectedLibraryFriendId || !currentUserFriend) return;
    setSelectedLibraryFriendId(currentUserFriend.id);
  }, [currentUserFriend, selectedLibraryFriendId]);

  const filtered = React.useMemo(() => {
    const q = filter.toLowerCase();
    return playlists.filter((pl) => {
      const matchesName = !q || pl.name.toLowerCase().includes(q);
      const matchesFriend =
        selectedLibraryFriendId === null ||
        pl.tracks.some((t) => t.friend_id === selectedLibraryFriendId);
      return matchesName && matchesFriend;
    });
  }, [playlists, filter, selectedLibraryFriendId]);

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
      const tracks: PlaylistTrackPayload[] = tracksData
        .map((t) => {
          const friendId = t.username ? friendMap.get(t.username) : undefined;
          if (!friendId) return null;
          return {
            ...t,
            friend_id: friendId,
          } as PlaylistTrackPayload;
        })
        .filter((t): t is PlaylistTrackPayload => t !== null);

      if (!tracks.length) {
        notify({ title: "Could not resolve any tracks to friends", type: "error" });
        return;
      }

      // Import directly
      await importPlaylist(name, tracks);
      notify({ title: `Imported '${name}'`, type: "success" });
      fetchPlaylists();

      // PostHog: Track playlist import
      posthog.capture("playlist_imported", {
        playlist_name: name,
        track_count: tracks.length,
        import_format: "json",
      });
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
      await importPlaylist(importedName, importedTracks);
      notify({ title: `Imported '${importedName}'`, type: "success" });
      fetchPlaylists();
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

      await importPlaylist(pendingImport.name, tracks);
      notify({ title: `Imported '${pendingImport.name}'`, type: "success" });
      fetchPlaylists();

      // PostHog: Track playlist import
      posthog.capture("playlist_imported", {
        playlist_name: pendingImport.name,
        track_count: tracks.length,
        import_format: "json",
      });
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
        <UnifiedSearchControls
          query={filter}
          onQueryChange={setFilter}
          friends={friends}
          selectedFriend={selectedFriend}
          onFriendChange={(friendId) =>
            setSelectedLibraryFriendId(friendId > 0 ? friendId : null)
          }
          includeAllOption={true}
          placeholder="Filter playlists..."
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
            {filter.trim()
              ? `No playlists match "${filter}"`
              : "No playlists match the selected library"}
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
                      boxSize="10"
                      rounded="md"
                      bg="blue.500"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      flexShrink={0}
                      fontWeight="bold"
                      fontSize="sm"
                    >
                      {pl.tracks.length}
                    </Box>
                    <VStack align="start" gap={0} minW={0}>
                      <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
                        {pl.name}
                      </Text>
                      <HStack gap={2} color="fg.muted" fontSize="xs">
                        <Text>{formatDateWithRelative(pl.created_at)}</Text>
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

                              // PostHog: Track playback started
                              posthog.capture("playback_started", {
                                playlist_id: pl.id,
                                playlist_name: pl.name,
                                track_count: pl.tracks.length,
                                source: "playlist_manager",
                              });
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
