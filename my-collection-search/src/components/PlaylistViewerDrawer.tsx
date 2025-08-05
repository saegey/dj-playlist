"use client";

import React, { useState } from "react";
import jsPDF from "jspdf";
import {
  Box,
  Flex,
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
import { FiMoreVertical } from "react-icons/fi";
import { usePlaylists } from "@/hooks/usePlaylists";

import { formatSeconds, parseDurationToSeconds } from "@/lib/trackUtils";
import { useSearchResults } from "@/hooks/useSearchResults";
import { MeiliSearch } from "meilisearch";
import { useSelectedUsername } from "@/hooks/useSelectedUsername";
import PlaylistPlayer from "./PlaylistPlayer";

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
  } = usePlaylists();
  const [selectedUsername] = useSelectedUsername();

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
  const exportPlaylistToPDF = () => {
    console.log("Exporting playlist to PDF", {
      playlist,
      displayPlaylist,
      totalPlaytimeFormatted,
    });
    if (!playlist.length) return;
    const currentPlaylist =
      displayPlaylist.length > 0 ? displayPlaylist : playlist;
    const doc = new jsPDF();
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text(`Total Tracks: ${playlist.length}`, 10, 15);
    doc.text(`Total Playtime: ${totalPlaytimeFormatted}`, 10, 18);
    let y = 25;
    doc.setFontSize(8);
    doc.setLineHeightFactor(0.8);

    currentPlaylist.forEach((track, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const indexStr = idx + 1 < 10 ? ` ${idx + 1}` : `${idx + 1}`;
      doc.text(
        `${indexStr}. ${track.artist || "Unknown Artist"} - ${
          track.title || "Untitled"
        }`,
        10,
        y
      );
      y += 3;
      if (track.album) {
        doc.text(`   Album: ${track.album}`, 12, y);
        y += 3;
      }
      if (track.bpm || track.key) {
        doc.text(
          `   BPM: ${track.bpm || "-"}   Key: ${track.key || "-"}`,
          12,
          y
        );
        y += 3;
      }
      // if (track.danceability) {
      //   doc.text(`   Danceability: ${track.danceability}`, 12, y);
      //   y += 5;
      // }
      if (track.duration_seconds) {
        doc.text(
          `   Duration: ${formatSeconds(track.duration_seconds)} / Position: ${
            track.position
          }`,
          12,
          y
        );
        y += 3;
      }
      if (track.local_tags) {
        // Remove problematic characters (newlines, tabs, excessive spaces, non-printable, and non-ASCII)
        const cleanTags = String(track.local_tags)
          .replace(/[^\x20-\x7E]+/g, " ") // keep only printable ASCII
          .replace(/\s+/g, " ") // collapse all whitespace
          .trim();
        doc.text(`   Tags: ${cleanTags}`, 12, y);
        y += 3;
      }
      y += 2;
    });
    doc.save("playlist.pdf");
  };

  return (
    <Portal>
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>
              Playlist ({hasMounted ? playlist.length : 0})
              <Text fontSize="sm" color="gray.500" mb={2}>
                Total Playtime: {hasMounted ? totalPlaytimeFormatted : "--:--"}
                {/* Playlist Recommendations */}
              </Text>
              <Box mt={2}>
                <Box>
                  <Flex gap={2} alignItems="center" mb={4} mt={4}>
                    {/* <Button
                      variant="solid"
                      size="sm"
                      onClick={() => {
                        setGeneticPlaylistOrder((v) => !v);
                      }}
                      disabled={!hasMounted || playlist.length === 0}
                    >
                      {geneticPlaylistOrder ? "Original" : "Genetic"}
                    </Button> */}
                    <Button
                      size="sm"
                      variant={"outline"}
                      onClick={exportPlaylist}
                      disabled={!hasMounted || playlist.length === 0}
                    >
                      JSON
                    </Button>
                    <Menu.Root key="order-menu">
                      <Menu.Trigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!hasMounted || playlist.length === 0}
                        >
                          Order
                        </Button>
                      </Menu.Trigger>
                      {/* <Portal> */}
                      <Menu.Positioner>
                        <Menu.Content>
                          <Menu.Item
                            value="original"
                            onSelect={() => {
                              // setShowOptimalOrder(false);
                              setOptimalOrderType("original");
                            }}
                          >
                            Original
                          </Menu.Item>
                          <Menu.Item
                            value="greedy"
                            onSelect={() => {
                              // setShowOptimalOrder(true);
                              setOptimalOrderType("greedy");
                            }}
                          >
                            Greedy
                          </Menu.Item>
                          <Menu.Item
                            value="genetic"
                            onSelect={() => {
                              // setShowOptimalOrder(true);
                              setOptimalOrderType("genetic");
                            }}
                          >
                            Genetic
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Positioner>
                      {/* </Portal> */}
                    </Menu.Root>
                    <Button
                      size="sm"
                      variant={"outline"}
                      onClick={exportPlaylistToPDF}
                      disabled={!hasMounted || playlist.length === 0}
                    >
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPlaylist([])}
                      disabled={!hasMounted || playlist.length === 0}
                    >
                      Clear
                    </Button>
                  </Flex>
                </Box>
              </Box>
              <PlaylistPlayer
                playlist={
                  displayPlaylist.length ? displayPlaylist : playlist ?? []
                }
              />
            </Drawer.Title>
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
          <Drawer.Footer>
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Drawer.CloseTrigger>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Positioner>
    </Portal>
  );
};
