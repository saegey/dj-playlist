"use client";

import React from "react";
import { Badge, Box, Button, Flex, Menu } from "@chakra-ui/react";
import TrackResultStore from "@/components/TrackResultStore";
import type { Track } from "@/types/track";
import { FiEdit, FiMoreVertical, FiPlus, FiPlusSquare } from "react-icons/fi";
import { useRecommendationsQuery, type RecommendedTrack } from "@/hooks/useRecommendations";
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
    <Box mt={0}>
      <Box display="flex" flexDirection="column" gap={2}>
        {recs.map((rec: RecommendedTrack, i: number) => (
          <TrackResultStore
            allowMinimize={false}
            key={`recommendation-${rec.track_id}-${i}`}
            trackId={rec.track_id}
            friendId={rec.friend_id}
            fallbackTrack={rec}
            buttons={[
              <Flex key="badges-menu" align="center" gap={1} wrap="wrap">
                {rec._simIdentity != null && rec._simAudio != null && (
                  <Badge colorPalette="purple" size="sm">Identity + Vibe</Badge>
                )}
                {rec._simIdentity != null && rec._simAudio == null && (
                  <Badge colorPalette="blue" size="sm">Identity</Badge>
                )}
                {rec._simAudio != null && rec._simIdentity == null && (
                  <Badge colorPalette="cyan" size="sm">Vibe</Badge>
                )}
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <Button variant="plain" size={["xs", "sm", "sm"]}>
                      <FiMoreVertical />
                    </Button>
                  </Menu.Trigger>
                  <Menu.Positioner>
                    <Menu.Content>
                      <Menu.Item onSelect={() => onAddToPlaylist(rec)} value="add">
                        <FiPlus /> Add to Playlist
                      </Menu.Item>
                      <Menu.Item onSelect={() => onEditTrack(rec)} value="edit">
                        <FiEdit /> Edit Track
                      </Menu.Item>
                      <Menu.Item onSelect={() => appendToQueue(rec)} value="queue">
                        <FiPlusSquare /> Add to Queue
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Menu.Root>
              </Flex>,
            ]}
          />
        ))}
      </Box>
    </Box>
  );
}
