"use client";

import React from "react";
import { exportPlaylistToPDF } from "@/lib/exportPlaylistPdf";
import { Box, Text, Flex, Collapsible, Container } from "@chakra-ui/react";
import PlaylistViewer from "@/components/PlaylistViewer";
import type { Track } from "@/types/track";
import { formatSeconds, parseDurationToSeconds } from "@/lib/trackUtils";
import PlaylistActionsMenu from "@/components/PlaylistActionsMenu";
import PlaylistRecommendations from "@/components/PlaylistRecommendations";
import { useTrackEditor } from "@/providers/TrackEditProvider";
import { useMeili } from "@/providers/MeiliProvider";
import { usePlaylistDrawer } from "@/providers/PlaylistDrawer";
import { usePlaylists } from "@/providers/PlaylistsProvider";
import { useSavePlaylistDialog } from "@/hooks/useSavePlaylistDialog";

export const PlaylistViewerDrawer = () => {
  const { client: meiliClient, ready } = useMeili();

  React.useEffect(() => {
    if (!ready || !meiliClient) return;
  }, [ready, meiliClient]);

  const { playlist, playlistsLoading, exportPlaylist, addToPlaylist, clearPlaylist, sortGreedy, sortGenetic } = usePlaylists();
  const { openTrackEditor } = useTrackEditor();
  const { isOpen, setOpen } = usePlaylistDrawer();

  const totalPlaytimeSeconds = playlist.reduce((sum, track) => {
    if (!track.duration && typeof track.duration_seconds === "number") {
      return sum + track.duration_seconds;
    }
    return sum + parseDurationToSeconds(track.duration);
  }, 0);
  const totalPlaytimeFormatted = formatSeconds(totalPlaytimeSeconds);
  const saveDialog = useSavePlaylistDialog();

  // No-op retained (toaster imported elsewhere)

  if (playlistsLoading) {
    return null; // or a loading spinner
  }

  return (
    <Box
      position="fixed"
      left={0}
      right={0}
      bottom={0}
      zIndex={20}
      pointerEvents="auto"
      backgroundColor="white"
      display={isOpen ? "block" : "none"}
    >
      <Collapsible.Root open={isOpen} onOpenChange={(e) => setOpen(e.open)}>
        <Box
          bg="bg"
          // borderTopWidth="1px"
          shadow="lg"
          left={0}
          right={0}
          top={3}
          marginBottom={"88px"}
          // maxH={"calc(100vh - 51px)"}
          height={{
            md: "calc(100vh - 72px - 56px)",
            sm: "calc(100vh - 84px - 56px)",
            lg: "calc(100vh - 84px - 56px)",
          }}
          maxHeight={{
            md: "calc(100vh - 72px - 56px)",
            sm: "calc(100vh - 84px - 56px)",
            lg: "calc(100vh - 84px - 56px)",
          }}
          marginTop={3}
          overflowY="auto" // <-- makes the playlist itself scroll
          overscrollBehavior="contain" // keeps scroll from bubbling the page
        >
          <Container maxW={["8xl", "2xl", "2xl"]} mb={"88px"} mt={3}>
            <Collapsible.Content>
              <Flex align="flex-start" w="100%" pt={3}>
                <Box>
                  <Text>Playlist</Text>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Total Playtime: {totalPlaytimeFormatted}
                    {/* Playlist Recommendations */}
                  </Text>
                </Box>
                <Flex flexGrow={1} justify="flex-end" align="flex-start">
                  <PlaylistActionsMenu
                    disabled={playlist.length === 0}
                    onSortGreedy={sortGreedy}
                    onSortGenetic={sortGenetic}
                    onExportJson={exportPlaylist}
                    onExportPdf={handleExportPlaylistToPDF}
                    onOpenSaveDialog={() => saveDialog.open()}
                    onClear={clearPlaylist}
                  />
                </Flex>
              </Flex>
              <PlaylistViewer />
              {/* Recommendations below playlist tracks */}
              <PlaylistRecommendations
                playlist={playlist as unknown as Track[]}
                limit={50}
                onAddToPlaylist={addToPlaylist}
                onEditTrack={openTrackEditor}
              />
            </Collapsible.Content>
          </Container>
        </Box>
        <saveDialog.Dialog />
      </Collapsible.Root>
    </Box>
  );
};
