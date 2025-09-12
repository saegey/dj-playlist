"use client";

import React, { useState } from "react";
import { exportPlaylistToPDF } from "@/lib/exportPlaylistPdf";
import {
  Box,
  Text,
  Flex,
  Collapsible,
  Container,
  Button,
  Menu,
} from "@chakra-ui/react";
import PlaylistViewer from "@/components/PlaylistViewer";

import TrackResult from "@/components/TrackResult";
import type { Track } from "@/types/track";
import { FiMoreVertical } from "react-icons/fi";

import { usePlaylists } from "@/providers/PlaylistsProvider";
import { useRecommendations } from "@/hooks/useRecommendations";

import { formatSeconds, parseDurationToSeconds } from "@/lib/trackUtils";
import PlaylistActionsMenu from "@/components/PlaylistActionsMenu";
import { usePlaylistDrawer } from "@/providers/PlaylistDrawer";
import { useTrackEditor } from "@/providers/TrackEditProvider";
import { useMeili } from "@/providers/MeiliProvider";
import { useSavePlaylistDialog } from "@/hooks/useSavePlaylistDialog";

export const PlaylistViewerDrawer = () => {
  const { client: meiliClient, ready } = useMeili();

  React.useEffect(() => {
    if (!ready || !meiliClient) return;
  }, [ready, meiliClient]);

  const {
    playlist,
    playlistsLoading,
    exportPlaylist,
    addToPlaylist,
    clearPlaylist,
    sortGreedy,
    sortGenetic,
  } = usePlaylists();
  const { openTrackEditor } = useTrackEditor();
  const { isOpen, setOpen } = usePlaylistDrawer();

  const [recommendations, setRecommendations] = useState<Track[]>([]);

  const totalPlaytimeSeconds = playlist.reduce((sum, track) => {
    if (!track.duration && typeof track.duration_seconds === "number") {
      return sum + track.duration_seconds;
    }
    return sum + parseDurationToSeconds(track.duration);
  }, 0);
  const totalPlaytimeFormatted = formatSeconds(totalPlaytimeSeconds);

  const saveDialog = useSavePlaylistDialog();

  const getRecommendations = useRecommendations();
  React.useEffect(() => {
    let cancelled = false;
    async function fetchRecs() {
      if (playlist.length === 0) {
        setRecommendations([]);
        return;
      }
      const recs = await getRecommendations(50, playlist);
      if (!cancelled) setRecommendations(recs);
    }
    fetchRecs();
    return () => {
      cancelled = true;
    };
  }, [playlist, getRecommendations]);

  // PDF export handler
  const handleExportPlaylistToPDF = () => {
    exportPlaylistToPDF({
      playlist,
      totalPlaytimeFormatted,
      filename: "playlist.pdf",
    });
  };

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
              {recommendations.length > 0 && (
                <Box mt={6}>
                  <Text fontWeight="bold" fontSize="sm" color="blue.500" mb={2}>
                    Recommended Tracks:
                  </Text>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {recommendations.map((rec: Track, i: number) => (
                      <TrackResult
                        allowMinimize={false}
                        key={`recommendation-${rec.track_id}-${i}`}
                        track={rec}
                        buttons={[
                          <Menu.Root key="menu">
                            <Menu.Trigger asChild>
                              <Button variant="plain" size={["xs", "sm", "md"]}>
                                <FiMoreVertical />
                              </Button>
                            </Menu.Trigger>

                            <Menu.Positioner>
                              <Menu.Content>
                                <Menu.Item
                                  onSelect={() => addToPlaylist(rec)}
                                  value="add"
                                >
                                  Add to Playlist
                                </Menu.Item>
                                <Menu.Item
                                  onSelect={() => openTrackEditor(rec)}
                                  value="edit"
                                >
                                  Edit Track
                                </Menu.Item>
                              </Menu.Content>
                            </Menu.Positioner>
                          </Menu.Root>,
                        ]}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Collapsible.Content>
          </Container>
        </Box>
        <saveDialog.Dialog />
      </Collapsible.Root>
    </Box>
  );
};
