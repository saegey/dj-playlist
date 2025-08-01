"use client";

import React, { useState } from "react";
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
    savePlaylist,
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
                    <Button
                      variant="solid"
                      size="sm"
                      onClick={savePlaylist}
                      disabled={!hasMounted || playlist.length === 0}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant={"outline"}
                      onClick={exportPlaylist}
                      disabled={!hasMounted || playlist.length === 0}
                    >
                      Export
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
                playlist,
                playlistCounts,
                moveTrack,
                setEditTrack: handleEditClick,
                removeFromPlaylist,
                playlistAvgEmbedding: playlistAvgEmbedding ?? undefined,
              })}
              // Optionally pass these if PlaylistViewer supports them:
              // currentTrackIndex={currentTrackIndex}
              // playTrack={playTrack}
              // isPlaying={isPlaying}
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
