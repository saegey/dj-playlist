"use client";

import React, { useState, useRef } from "react";

import { Flex, Drawer, Container } from "@chakra-ui/react";
import SearchResults from "@/components/SearchResults";
import { useSearchResults } from "@/hooks/useSearchResults";
import PlaylistsProvider, { usePlaylists } from "@/hooks/usePlaylists";
import type { Track } from "@/types/track";
import TopMenuBar from "@/components/MenuBar";
import { TrackEditFormProps } from "../components/TrackEditForm";
import TrackEditDialog from "@/components/TrackEditDialog";
import { PlaylistViewerDrawer } from "@/components/PlaylistViewerDrawer";
import { usePlaylistDrawer } from "@/providers/PlaylistDrawer";
import { Toaster } from "@/components/ui/toaster";
import { useMeili } from "@/providers/MeiliProvider";
import { useUsername } from "@/providers/UsernameProvider";

// TrackEditForm is used via TrackEditDialog
const SearchPage = () => {
  // sidebar open state is managed by PlaylistDrawer context
  const { client: meiliClient, ready } = useMeili();

  React.useEffect(() => {
    if (!ready || !meiliClient) return;
  }, [ready, meiliClient]);

  // const [xmlImportModalOpen, setXmlImportModalOpen] = useState(false);
  // Prevent hydration mismatch for playlist count and playtime
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const { username: selectedUsername } = useUsername();
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

  const { addToPlaylist } = usePlaylists();

  const [editTrack, setEditTrack] = useState<Track | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const { isOpen, setOpen } = usePlaylistDrawer();

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

  console.log("isOpen:", isOpen);

  return (
    <>
      <Toaster />
      <TopMenuBar current="/" />
      <Flex gap={4} direction="row">
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
      </Flex>
      <TrackEditDialog
        editTrack={editTrack}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        initialFocusRef={initialFocusRef}
        onSave={handleSaveTrack}
      />
      <Drawer.Root
        open={isOpen}
        onOpenChange={(e) => setOpen(e.open)}
        size={["sm", "md", "md"]}
      >
        <PlaylistViewerDrawer
          hasMounted={hasMounted}
          handleEditClick={handleEditClick}
          meiliClient={meiliClient}
        />
      </Drawer.Root>
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
