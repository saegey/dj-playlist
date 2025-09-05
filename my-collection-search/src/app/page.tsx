"use client";

import React, { useState, useRef } from "react";
import { Flex, Container, Box } from "@chakra-ui/react";

import SearchResults from "@/components/SearchResults";
import { useSearchResults } from "@/hooks/useSearchResults";
import PlaylistsProvider, { usePlaylists } from "@/hooks/usePlaylists";
import type { Track } from "@/types/track";
import { TrackEditFormProps } from "../components/TrackEditForm";
import TrackEditDialog from "@/components/TrackEditDialog";
import { PlaylistViewerDrawer } from "@/components/PlaylistViewerDrawer";
import { useMeili } from "@/providers/MeiliProvider";
import { useUsername } from "@/providers/UsernameProvider";
import { useTracksQuery } from "@/hooks/useTracksQuery";
import { toaster } from "@/components/ui/toaster";

// TrackEditForm is used via TrackEditDialog
const SearchPage = () => {
  // sidebar open state is managed by PlaylistDrawer context
  const { client: meiliClient, ready } = useMeili();

  React.useEffect(() => {
    if (!ready || !meiliClient) return;
  }, [ready, meiliClient]);

  const { username: selectedUsername } = useUsername();
  const playlistPortalRef = useRef<HTMLDivElement | null>(null);
  const {
    query,
    onQueryChange,
    estimatedResults,
    results,
    playlistCounts,
    hasMore,
    loadMore,
    loading,
  } = useSearchResults({ client: meiliClient, username: selectedUsername });
  const { saveTrack } = useTracksQuery();

  const { addToPlaylist } = usePlaylists();

  const [editTrack, setEditTrack] = useState<Track | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  const handleEditClick = (track: Track) => {
    setEditTrack(track);
    setDialogOpen(true);
  };

  const handleSaveTrack = async (data: TrackEditFormProps) => {
    try {
      await saveTrack(data);
      setEditTrack(null);
      setDialogOpen(false);
      toaster.create({ title: "Updated track", type: "success" });
    } catch (error) {
      console.error("Failed to update track", error);
      toaster.create({ title: "Failed to update track", type: "error" });
    }
  };

  return (
    <>
      <Flex gap={4} direction="row">
        <Box pos="relative" flex="1" ref={playlistPortalRef}>
          {/* Search Results */}
          <Container maxW={["8xl", "2xl", "2xl"]} pt={3}>
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

          {/* Playlist Drawer renders within this container via Portal */}
          <PlaylistViewerDrawer
            handleEditClick={handleEditClick}
            meiliClient={meiliClient}
            containerRef={playlistPortalRef}
          />
        </Box>
      </Flex>
      <TrackEditDialog
        editTrack={editTrack}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        initialFocusRef={initialFocusRef}
        onSave={handleSaveTrack}
      />
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
