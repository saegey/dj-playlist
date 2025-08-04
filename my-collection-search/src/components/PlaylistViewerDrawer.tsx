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
import PlaylistViewer, { keyToCamelot } from "@/components/PlaylistViewer";
import { useMemo } from "react";

import TrackResult from "@/components/TrackResult";
import { usePlaylistViewer } from "@/hooks/usePlaylistViewer";
import type { Track } from "@/types/track";
import {
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical,
  FiPause,
  FiPlay,
} from "react-icons/fi";
import { usePlaylists } from "@/hooks/usePlaylists";
import { usePlaylistPlayer } from "@/hooks/usePlaylistPlayer";

import { formatSeconds, parseDurationToSeconds } from "@/lib/trackUtils";
import { useSearchResults } from "@/hooks/useSearchResults";
import { MeiliSearch } from "meilisearch";
import { useSelectedUsername } from "@/hooks/useSelectedUsername";

type TrackCompat = Track & {
  _vectors?: { default?: number[] };
  energy?: number | string;
  bpm?: number | string;
};
interface TrackWithCamelot {
  camelot_key?: string;
  _vectors?: { default?: number[] };
  energy: number;
  bpm: number;
  idx: number;
}

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
    exportPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    moveTrack,
    playlistAvgEmbedding,
    getRecommendations,
  } = usePlaylists();
  const [selectedUsername] = useSelectedUsername();

  // Playlist player state
  const {
    isPlaying,
    currentTrackIndex,
    currentTrack,
    setPlaylist: setPlaylistPlayer,
    play,
    pause,
    playNext,
    playPrev,
    audioElement,
  } = usePlaylistPlayer(playlist);

  const { playlistCounts } = useSearchResults({
    client: meiliClient,
    username: selectedUsername,
  });

  const [showOptimalOrder, setShowOptimalOrder] = useState(false);
  const [recommendations, setRecommendations] = useState<Track[]>([]);

  // Compute optimal order if needed (must be after playlist/showOptimalOrder are defined)
  const optimalPlaylist = useMemo(() => {
    if (!showOptimalOrder || playlist.length === 0) return playlist;
    // --- Types ---

    function cosineSimilarity(a: number[], b: number[]): number {
      const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const normA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
      const normB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
      return dot / (normA * normB);
    }
    function camelotDistance(a: string, b: string): number {
      if (!a || !b) return 6;
      const parse = (k: string) => {
        const m = k.match(/^(\d{1,2})([AB])$/i);
        if (!m) return null;
        return [parseInt(m[1], 10), m[2].toUpperCase()];
      };
      const pa = parse(a) as [number, string] | null;
      const pb = parse(b) as [number, string] | null;
      if (!pa || !pb) return 6;
      const [numA, modeA] = pa;
      const [numB, modeB] = pb;
      if (modeA === modeB) {
        return Math.min(Math.abs(numA - numB), 12 - Math.abs(numA - numB));
      }
      return numA === numB ? 1 : 2;
    }
    function transitionPenalty(
      from: TrackWithCamelot,
      to: TrackWithCamelot
    ): number {
      const bpmDiff = Math.abs((from.bpm ?? 0) - (to.bpm ?? 0));
      const energyJump = Math.abs((from.energy ?? 0) - (to.energy ?? 0));
      const harmonicPenalty = camelotDistance(
        from.camelot_key ?? "",
        to.camelot_key ?? ""
      );
      return 0.1 * bpmDiff + 1.5 * energyJump + 2.0 * harmonicPenalty;
    }
    function buildCompatibilityGraph(
      tracks: TrackWithCamelot[],
      alpha = 0.7
    ): number[][] {
      const n = tracks.length;
      const edges: number[][] = Array.from({ length: n }, () =>
        Array(n).fill(0)
      );
      for (let i = 0; i < n; ++i) {
        for (let j = 0; j < n; ++j) {
          if (i === j) continue;
          let sim = 0;
          const vecA = tracks[i]._vectors?.default ?? [];
          const vecB = tracks[j]._vectors?.default ?? [];
          if (vecA.length && vecB.length) {
            sim = cosineSimilarity(vecA, vecB);
          }
          const penalty = transitionPenalty(tracks[i], tracks[j]);
          edges[i][j] = alpha * sim + (1 - alpha) * -penalty;
        }
      }
      return edges;
    }
    function greedyPath(
      tracks: TrackWithCamelot[],
      edges: number[][]
    ): number[] {
      const n = tracks.length;
      if (n === 0) return [];
      const visited = Array(n).fill(false);
      const path = [0];
      visited[0] = true;
      for (let step = 1; step < n; ++step) {
        const last = path[path.length - 1];
        let best = -Infinity;
        let bestIdx = -1;
        for (let j = 0; j < n; ++j) {
          if (!visited[j] && edges[last][j] > best) {
            best = edges[last][j];
            bestIdx = j;
          }
        }
        if (bestIdx === -1) break;
        path.push(bestIdx);
        visited[bestIdx] = true;
      }
      return path;
    }
    const updated: TrackWithCamelot[] = playlist.map((track, idx) => {
      const t = track as TrackCompat;
      return {
        camelot_key: keyToCamelot(t.key),
        _vectors: t._vectors,
        energy: typeof t.energy === "number" ? t.energy : Number(t.energy) || 0,
        bpm: typeof t.bpm === "number" ? t.bpm : Number(t.bpm) || 0,
        idx,
      };
    });
    const edges = buildCompatibilityGraph(updated);
    const path = greedyPath(updated, edges);
    return path.map((i) => playlist[updated[i].idx]);
  }, [showOptimalOrder, playlist]);

  React.useEffect(() => {
    setPlaylistPlayer(optimalPlaylist);
  }, [optimalPlaylist, setPlaylistPlayer]);

  const totalPlaytimeSeconds = optimalPlaylist.reduce((sum, track) => {
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
    if (!playlist.length) return;
    const doc = new jsPDF();
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text(`Total Tracks: ${playlist.length}`, 10, 15);
    doc.text(`Total Playtime: ${totalPlaytimeFormatted}`, 10, 18);
    let y = 25;
    doc.setFontSize(8);
    doc.setLineHeightFactor(0.8);

    playlist.forEach((track, idx) => {
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
                      onClick={savePlaylist}
                      disabled={!hasMounted || playlist.length === 0}
                    >
                      Save
                    </Button> */}
                    <Button
                      size="sm"
                      variant={"outline"}
                      onClick={exportPlaylist}
                      disabled={!hasMounted || playlist.length === 0}
                    >
                      Export JSON
                    </Button>
                    <Button
                      size="sm"
                      variant={showOptimalOrder ? "solid" : "outline"}
                      onClick={() => {
                        setShowOptimalOrder((v) => !v);
                      }}
                      disabled={!hasMounted || playlist.length === 0}
                    >
                      {showOptimalOrder
                        ? "Show Original Order"
                        : "Show Optimal Order"}
                    </Button>
                    <Button
                      size="sm"
                      variant={"outline"}
                      onClick={exportPlaylistToPDF}
                      disabled={!hasMounted || playlist.length === 0}
                    >
                      Export PDF
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
              <Box>
                {/* Playlist Player Controls */}
                <Flex gap={2} alignItems="center" mt={2} mb={2}>
                  <Button
                    size="sm"
                    onClick={playPrev}
                    disabled={
                      currentTrackIndex === null || currentTrackIndex <= 0
                    }
                  >
                    <FiChevronLeft />
                  </Button>
                  {isPlaying ? (
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={pause}
                      disabled={currentTrackIndex === null}
                    >
                      <FiPause />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={play}
                      disabled={playlist.length === 0}
                    >
                      <FiPlay />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={playNext}
                    disabled={
                      currentTrackIndex === null ||
                      currentTrackIndex >= playlist.length - 1
                    }
                  >
                    <FiChevronRight />
                  </Button>
                </Flex>
              </Box>
              <Box>
                {currentTrack && (
                  <Text fontSize="sm" color="blue.500" ml={2}>
                    Now Playing: {currentTrack.artist} - {currentTrack.title}
                  </Text>
                )}
              </Box>
              <Box>{audioElement}</Box>
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <PlaylistViewer
              {...usePlaylistViewer({
                playlist: optimalPlaylist,
                playlistCounts,
                moveTrack,
                setEditTrack: handleEditClick,
                removeFromPlaylist,
                playlistAvgEmbedding: playlistAvgEmbedding ?? undefined,
              })}
              showOptimalOrder={showOptimalOrder}
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
