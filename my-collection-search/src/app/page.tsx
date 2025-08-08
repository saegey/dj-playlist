"use client";

import React, { useState, useRef } from "react";

import {
  Box,
  Flex,
  Button,
  Portal,
  CloseButton,
  Drawer,
  Container,
  Float,
  Circle,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";
import SearchResults from "@/components/SearchResults";
import { useSearchResults } from "@/hooks/useSearchResults";
import PlaylistsProvider, { usePlaylists } from "@/hooks/usePlaylists";
import PlaylistManager from "@/components/PlaylistManager";
import type { Track } from "@/types/track";
import TopMenuBar from "@/components/MenuBar";
import { TrackEditFormProps } from "../components/TrackEditForm";
import { FiList } from "react-icons/fi";
import { PlaylistViewerDrawer } from "@/components/PlaylistViewerDrawer";
import { Toaster } from "@/components/ui/toaster";
import { useMeili } from "@/providers/MeiliProvider";
import { useUsername } from "@/providers/UsernameProvider";

const TrackEditForm = dynamic(() => import("../components/TrackEditForm"), {
  ssr: false,
});
const SearchPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false);
  const { client: meiliClient, ready } = useMeili();

  React.useEffect(() => {
    if (!ready || !meiliClient) return;
  }, [ready, meiliClient]);

  const [xmlImportModalOpen, setXmlImportModalOpen] = useState(false);
  // Prevent hydration mismatch for playlist count and playtime
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const { username: selectedUsername, setUsername: setSelectedUsername } =
    useUsername();
  const {
    query,
    onQueryChange,
    estimatedResults,
    results,
    playlistCounts,
    hasMore,
    loadMore,
    needsRefresh,
    loading,
  } = useSearchResults({ client: meiliClient, username: selectedUsername });

  const { playlist, addToPlaylist } = usePlaylists();

  const [editTrack, setEditTrack] = useState<Track | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  const handleEditClick = (track: Track) => {
    console.log("Editing track:", track);
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

  return (
    <>
      <Toaster />
      <TopMenuBar current="/" />
      <Flex gap={4} direction="row">
        {/* Playlist Sidebar Drawer Trigger */}
        <Drawer.Root
          open={sidebarDrawerOpen}
          onOpenChange={(e) => setSidebarDrawerOpen(e.open)}
          placement={"start"}
          size={["full", "md", "md"]}
        >
          <Drawer.Trigger asChild>
            <Button
              position="fixed"
              left={6}
              bottom={6}
              zIndex={100}
              colorScheme="gray"
              size="lg"
              borderRadius="full"
              boxShadow="md"
            >
              Playlists
            </Button>
          </Drawer.Trigger>
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content>
                <Drawer.Header>
                  <Drawer.Title>Saved Playlists</Drawer.Title>
                </Drawer.Header>
                <Drawer.Body>
                  <Box>
                    {meiliClient && (
                      <PlaylistManager
                        xmlImportModalOpen={xmlImportModalOpen}
                        setXmlImportModalOpen={setXmlImportModalOpen}
                        client={meiliClient}
                      />
                    )}
                  </Box>
                </Drawer.Body>
                <Drawer.Footer>
                  <Drawer.CloseTrigger asChild>
                    <CloseButton size="sm" />
                  </Drawer.CloseTrigger>
                </Drawer.Footer>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>

        {/* Search Results */}
        <Container maxW={["8xl", "2xl", "2xl"]}>
          <SearchResults
            query={query}
            onQueryChange={onQueryChange}
            estimatedResults={estimatedResults}
            results={results}
            playlistCounts={playlistCounts}
            addToPlaylist={addToPlaylist}
            handleEditClick={handleEditClick}
            hasMore={hasMore}
            loadMore={loadMore}
            loading={loading}
          />
        </Container>

        {/* Playlist Drawer Trigger */}
        <Drawer.Root
          open={drawerOpen}
          onOpenChange={(e) => setDrawerOpen(e.open)}
          size={["sm", "md", "md"]}
        >
          <Drawer.Trigger asChild>
            <Box position="fixed" right={6} bottom={6} zIndex={100}>
              <Button
                colorScheme="blue"
                size="lg"
                borderRadius="full"
                boxShadow="md"
                position="relative"
                pr={hasMounted && playlist.length > 0 ? 8 : undefined}
              >
                <FiList size={25} />
                {hasMounted && playlist.length > 0 && (
                  <Float placement="top-end">
                    <Circle size="6" bg="red.500" color="white" fontSize="sm">
                      {playlist.length}
                    </Circle>
                  </Float>
                )}
              </Button>
            </Box>
          </Drawer.Trigger>

          <PlaylistViewerDrawer
            hasMounted={hasMounted}
            handleEditClick={handleEditClick}
            meiliClient={meiliClient}
          />
        </Drawer.Root>
      </Flex>
      {editTrack && editTrack.username && (
        <TrackEditForm
          track={{ ...editTrack, username: editTrack.username }}
          onSave={handleSaveTrack}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          initialFocusRef={initialFocusRef}
        />
      )}
    </>
  );
};

const SearchPageWrapper = () => {
  return (
    <PlaylistsProvider>
      <SearchPage />
    </PlaylistsProvider>
  );
};
export default SearchPageWrapper;
