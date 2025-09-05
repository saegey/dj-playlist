"use client";

import React, { useRef } from "react";
import { Flex, Container, Box } from "@chakra-ui/react";

import SearchResults from "@/components/SearchResults";
import PlaylistsProvider from "@/hooks/usePlaylists";
import type { Track } from "@/types/track";
import { PlaylistViewerDrawer } from "@/components/PlaylistViewerDrawer";
import { useMeili } from "@/providers/MeiliProvider";

// TrackEditForm is used via TrackEditDialog
const SearchPage = () => {
  // sidebar open state is managed by PlaylistDrawer context
  const { client: meiliClient, ready } = useMeili();

  React.useEffect(() => {
    if (!ready || !meiliClient) return;
  }, [ready, meiliClient]);

  const playlistPortalRef = useRef<HTMLDivElement | null>(null);

  // const [ setEditTrack] = useState<Track | null>(null);
  // const [setDialogOpen] = useState(false);

  const handleEditClick = (track: Track) => {
    // setEditTrack(track);
    // setDialogOpen(true);
    console.log("Edit track clicked", track);
  };

  return (
    <>
      <Flex gap={4} direction="row">
        <Box pos="relative" flex="1" ref={playlistPortalRef}>
          {/* Search Results */}
          <Container maxW={["8xl", "2xl", "2xl"]} pt={3}>
            <SearchResults />
          </Container>

          {/* Playlist Drawer renders within this container via Portal */}
          <PlaylistViewerDrawer
            handleEditClick={handleEditClick}
            meiliClient={meiliClient}
            containerRef={playlistPortalRef}
          />
        </Box>
      </Flex>
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
