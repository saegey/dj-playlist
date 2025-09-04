"use client";

import React, { useState } from "react";
import { exportPlaylistToPDF } from "@/lib/exportPlaylistPdf";
import {
  Box,
  Text,
  Button,
  Menu,
  Flex,
  Collapsible,
  Container,
} from "@chakra-ui/react";
import PlaylistViewer from "@/components/PlaylistViewer";

import TrackResult from "@/components/TrackResult";
import { usePlaylistViewer } from "@/hooks/usePlaylistViewer";
import type { Track } from "@/types/track";
import { FiMoreVertical, FiSave } from "react-icons/fi";
import { GiTakeMyMoney } from "react-icons/gi";
import { PiDna, PiFilePdf } from "react-icons/pi";
import { MdOutlineClearAll } from "react-icons/md";

import { usePlaylists } from "@/hooks/usePlaylists";

import { formatSeconds, parseDurationToSeconds } from "@/lib/trackUtils";
import { useSearchResults } from "@/hooks/useSearchResults";
import { MeiliSearch } from "meilisearch";
import { LuFileJson } from "react-icons/lu";
import NamePlaylistDialog from "./NamePlaylistDialog";
import { toaster } from "./ui/toaster";
import { useUsername } from "@/providers/UsernameProvider";
import { usePlaylistDrawer } from "@/providers/PlaylistDrawer";

export const PlaylistViewerDrawer = ({
  handleEditClick,
  meiliClient,
}: {
  handleEditClick: (track: Track) => void;
  meiliClient: MeiliSearch | null;
  containerRef?: React.MutableRefObject<HTMLDivElement | null>;
}) => {
  const {
    playlist,
    setPlaylist,
    displayPlaylist,
    exportPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    moveTrack,
    playlistAvgEmbedding,
    getRecommendations,
    savePlaylist,
    playlistName,
    setPlaylistName,
    optimalOrderType,
    setOptimalOrderType,
  } = usePlaylists();
  const { username: selectedUsername } = useUsername();
  const { isOpen, setOpen } = usePlaylistDrawer();

  const { playlistCounts } = useSearchResults({
    client: meiliClient,
    username: selectedUsername,
  });

  const [recommendations, setRecommendations] = useState<Track[]>([]);

  const totalPlaytimeSeconds = playlist.reduce((sum, track) => {
    if (!track.duration && typeof track.duration_seconds === "number") {
      return sum + track.duration_seconds;
    }
    return sum + parseDurationToSeconds(track.duration);
  }, 0);
  const totalPlaytimeFormatted = formatSeconds(totalPlaytimeSeconds);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchRecommendations() {
      if (playlist.length === 0) {
        setRecommendations([]);
        return;
      }
      const recs = await getRecommendations(50);
      if (!cancelled) setRecommendations(recs);
    }
    fetchRecommendations();
    return () => {
      cancelled = true;
    };
  }, [playlist, getRecommendations, playlistAvgEmbedding]);

  // PDF export handler
  const handleExportPlaylistToPDF = () => {
    exportPlaylistToPDF({
      playlist,
      displayPlaylist,
      totalPlaytimeFormatted,
      filename: "playlist.pdf",
    });
  };

  const handleSavePlaylist = async () => {
    try {
      await savePlaylist();
      toaster.create({
        title: "Playlist saved successfully",
        type: "success",
      });
      setIsSaveModalOpen(false);
      // Optionally, you can refresh the playlist or show a success message
    } catch (error) {
      console.error("Failed to save playlist:", error);
      toaster.create({
        title: "Failed to save playlist",
        type: "error",
      });
    }
  };

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
          top={0}
          marginBottom={"88px"}
          // maxH={"calc(100vh - 51px)"}
          height={{
            md: "calc(100vh - 72px)",
            sm: "calc(100vh - 84px)",
            lg: "calc(100vh - 84px)",
          }}
          maxHeight={{
            md: "calc(100vh - 72px)",
            sm: "calc(100vh - 84px)",
            lg: "calc(100vh - 84px)",
          }}
          overflowY="auto" // <-- makes the playlist itself scroll
          overscrollBehavior="contain" // keeps scroll from bubbling the page
        >
          <Container maxW={["8xl", "2xl", "2xl"]} mb={"88px"} mt={3}>
            <Collapsible.Content>
              <Flex align="flex-start" w="100%">
                <Box>
                  <Text>Playlist ({playlist.length})</Text>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Total Playtime: {totalPlaytimeFormatted}
                    {/* Playlist Recommendations */}
                  </Text>
                </Box>
                <Flex flexGrow={1} justify="flex-end" align="flex-start">
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label="Playlist actions"
                        px={2}
                        disabled={playlist.length === 0}
                      >
                        <FiMoreVertical />
                      </Button>
                    </Menu.Trigger>
                    <Menu.Positioner>
                      <Menu.Content>
                        <Flex
                          px={3}
                          py={1}
                          fontWeight="bold"
                          fontSize="sm"
                          color="gray.500"
                        >
                          Playlist Sort
                        </Flex>
                        <Box
                          as="hr"
                          my={1}
                          borderColor="gray.200"
                          borderWidth={0}
                          borderTopWidth={1}
                        />
                        <Menu.Item
                          value="sort-greedy"
                          onSelect={() => setOptimalOrderType("greedy")}
                        >
                          <GiTakeMyMoney /> Greedy Order
                        </Menu.Item>
                        <Menu.Item
                          value="sort-genetic"
                          onSelect={() => setOptimalOrderType("genetic")}
                        >
                          <PiDna /> Genetic Order
                        </Menu.Item>
                        <Box
                          as="hr"
                          my={1}
                          borderColor="gray.200"
                          borderWidth={0}
                          borderTopWidth={1}
                        />
                        <Menu.Item
                          value="export-json"
                          onSelect={exportPlaylist}
                        >
                          <LuFileJson /> Export JSON
                        </Menu.Item>
                        <Menu.Item
                          value="export-pdf"
                          onSelect={handleExportPlaylistToPDF}
                        >
                          <PiFilePdf /> Export PDF
                        </Menu.Item>
                        <Menu.Item
                          value="save"
                          onSelect={() => setIsSaveModalOpen(true)}
                        >
                          <FiSave /> Save Playlist
                        </Menu.Item>
                        <Menu.Item
                          value="clear"
                          onSelect={() => setPlaylist([])}
                          color="fg.error"
                          _hover={{ bg: "bg.error", color: "fg.error" }}
                        >
                          <MdOutlineClearAll /> Clear Playlist
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Menu.Root>
                </Flex>
              </Flex>
              <PlaylistViewer
                {...usePlaylistViewer({
                  playlist: playlist,
                  playlistCounts,
                  moveTrack,
                  setEditTrack: handleEditClick,
                  removeFromPlaylist,
                  playlistAvgEmbedding: playlistAvgEmbedding ?? undefined,
                })}
                optimalOrderType={optimalOrderType}
              />
              {/* Recommendations below playlist tracks */}
              {recommendations.length > 0 && (
                <Box mt={6}>
                  <Text fontWeight="bold" fontSize="sm" color="blue.500" mb={2}>
                    Recommended Tracks:
                  </Text>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {recommendations.map((rec: Track) => (
                      <TrackResult
                        allowMinimize={false}
                        key={`recommendation-${rec.track_id}`}
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
                                  onSelect={() => handleEditClick(rec)}
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
        <NamePlaylistDialog
          open={isSaveModalOpen}
          name={playlistName}
          setName={setPlaylistName}
          trackCount={playlist.length}
          onConfirm={() => {
            handleSavePlaylist();
          }}
          onCancel={() => setIsSaveModalOpen(false)}
          confirmLabel="Save Playlist"
        />
      </Collapsible.Root>
    </Box>
  );
};
