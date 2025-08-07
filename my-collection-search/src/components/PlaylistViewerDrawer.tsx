"use client";

import React, { useState } from "react";
import { exportPlaylistToPDF } from "@/lib/exportPlaylistPdf";
import {
  Box,
  Text,
  Button,
  Portal,
  CloseButton,
  Drawer,
  Menu,
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
import { useSelectedUsername } from "@/hooks/useSelectedUsername";
import PlaylistPlayer from "./PlaylistPlayer";
import { LuFileJson } from "react-icons/lu";
import NamePlaylistDialog from "./NamePlaylistDialog";
import { toaster } from "./ui/toaster";

export const PlaylistViewerDrawer = ({
  hasMounted,
  handleEditClick,
  meiliClient,
}: {
  hasMounted: boolean;
  handleEditClick: (track: Track) => void;
  meiliClient: MeiliSearch | null;
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
  } = usePlaylists();
  const [selectedUsername] = useSelectedUsername();

  // const [playlistName, setPlaylistName] = useState("");

  // Playlist player state

  const { playlistCounts } = useSearchResults({
    client: meiliClient,
    username: selectedUsername,
  });

  const [optimalOrderType, setOptimalOrderType] = useState<
    "original" | "greedy" | "genetic"
  >("original");
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
    console.log("Fetching recommendations for playlist", {
      playlistAvgEmbedding,
      k: 10,
      playlist,
    });
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
    <Portal>
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title flex="1">
              Playlist ({hasMounted ? playlist.length : 0})
              <Text fontSize="sm" color="gray.500" mb={2}>
                Total Playtime: {hasMounted ? totalPlaytimeFormatted : "--:--"}
                {/* Playlist Recommendations */}
              </Text>
            </Drawer.Title>
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Playlist actions"
                  px={2}
                  disabled={!hasMounted || playlist.length === 0}
                  mt={4}
                >
                  <FiMoreVertical />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Box
                    px={3}
                    py={1}
                    fontWeight="bold"
                    fontSize="sm"
                    color="gray.500"
                  >
                    Playlist Actions
                  </Box>
                  <Box
                    as="hr"
                    my={1}
                    borderColor="gray.200"
                    borderWidth={0}
                    borderTopWidth={1}
                  />
                  <Menu.Item
                    value="sort-original"
                    onSelect={() => setOptimalOrderType("original")}
                  >
                    Original Order
                  </Menu.Item>
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
                  <Menu.Item value="export-json" onSelect={exportPlaylist}>
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
          </Drawer.Header>
          <Drawer.Body>
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
                      key={rec.track_id}
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
          </Drawer.Body>
          <Drawer.CloseTrigger asChild>
            <CloseButton size="sm" />
          </Drawer.CloseTrigger>
          <Drawer.Footer>
            <PlaylistPlayer
              playlist={
                displayPlaylist.length ? displayPlaylist : playlist ?? []
              }
            />
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Positioner>
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
    </Portal>
  );
};
