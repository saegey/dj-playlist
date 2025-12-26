"use client";

import React from "react";
import { Box, Text, Button, Menu } from "@chakra-ui/react";
import TrackResult from "@/components/TrackResult";
import type { Track } from "@/types/track";
import { FiEdit, FiMoreVertical, FiPlus, FiPlusSquare } from "react-icons/fi";
import { useRecommendationsQuery } from "@/hooks/useRecommendations";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";

export interface PlaylistRecommendationsProps {
  playlist: Track[];
  limit?: number;
  onAddToPlaylist: (track: Track) => void;
  onEditTrack: (track: Track) => void;
}

export default function PlaylistRecommendations({
  playlist,
  limit = 50,
  onAddToPlaylist,
  onEditTrack,
}: PlaylistRecommendationsProps) {
  const { data: recs = [] } = useRecommendationsQuery(playlist, limit);
  const { appendToQueue } = usePlaylistPlayer();

  if (recs.length === 0) return null;

  return (
    <Box mt={6}>
      <Text fontWeight="bold" fontSize="sm" color="blue.500" mb={2}>
        Recommended Tracks:
      </Text>
      <Box display="flex" flexDirection="column" gap={2}>
        {recs.map((rec: Track, i: number) => (
          <TrackResult
            allowMinimize={false}
            key={`recommendation-${rec.track_id}-${i}`}
            track={rec}
            buttons={[
              <Menu.Root key="menu">
                <Menu.Trigger asChild>
                  <Button variant="plain" size={["xs", "sm", "sm"]}>
                    <FiMoreVertical />
                  </Button>
                </Menu.Trigger>

                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item
                      onSelect={() => onAddToPlaylist(rec)}
                      value="add"
                    >
                      <FiPlus /> Add to Playlist
                    </Menu.Item>
                    <Menu.Item onSelect={() => onEditTrack(rec)} value="edit">
                      <FiEdit /> Edit Track
                    </Menu.Item>
                    <Menu.Item
                      onSelect={() => appendToQueue(rec)}
                      value="queue"
                    >
                      <FiPlusSquare /> Add to Queue
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>,
            ]}
          />
        ))}
      </Box>
    </Box>
  );
}
