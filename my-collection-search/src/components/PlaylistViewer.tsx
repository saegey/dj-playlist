import React from "react";
import {
  Box,
  Button,
  Menu,
  EmptyState,
  VStack,
} from "@chakra-ui/react";
import { FiHeadphones, FiMoreVertical } from "react-icons/fi";
import TrackResult from "@/components/TrackResult";
import type { Track } from "@/types/track";

interface PlaylistViewerProps {
  playlist: Track[];
  playlistCounts: Record<string, number>;
  moveTrack: (fromIdx: number, toIdx: number) => void;
  setEditTrack: (track: Track) => void;
  removeFromPlaylist: (trackId: string) => void;
}

const PlaylistViewer: React.FC<PlaylistViewerProps> = ({
  playlist,
  playlistCounts,
  moveTrack,
  setEditTrack,
  removeFromPlaylist,
}) => (
  <Box overflowY="auto">
    {playlist.length === 0 ? (
      <EmptyState.Root size={"sm"}>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiHeadphones />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>Your playlist is empty</EmptyState.Title>
            <EmptyState.Description>
              Add tracks to your playlist to get started.
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    ) : (
      playlist.map((track, idx) => (
        <TrackResult
          key={track.track_id}
          track={track}
          minimized
          playlistCount={playlistCounts[track.track_id]}
          buttons={[
            <Menu.Root key="menu">
              <Menu.Trigger asChild>
                <Button variant="plain" size="xs">
                  <FiMoreVertical size={16} />
                </Button>
              </Menu.Trigger>
              {/* <Portal> */}
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    onSelect={() => moveTrack(idx, idx - 1)}
                    value="up"
                    disabled={idx === 0}
                  >
                    Move Up
                  </Menu.Item>
                  <Menu.Item
                    onSelect={() => moveTrack(idx, idx + 1)}
                    value="down"
                    disabled={idx === playlist.length - 1}
                  >
                    Move Down
                  </Menu.Item>
                  <Menu.Item onSelect={() => setEditTrack(track)} value="edit">
                    Edit
                  </Menu.Item>
                  <Menu.Item
                    onSelect={() => removeFromPlaylist(track.track_id)}
                    value="remove"
                  >
                    Remove
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
              {/* </Portal> */}
            </Menu.Root>,
          ]}
        />
      ))
    )}
  </Box>
);

export default PlaylistViewer;
