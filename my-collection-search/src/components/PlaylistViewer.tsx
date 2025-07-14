import React from "react";
import { Box, Text, Button, Portal, Menu, Icon } from "@chakra-ui/react";
import {
  FiArrowUp,
  FiArrowDown,
  FiEdit,
  FiTrash2,
  FiMoreVertical,
} from "react-icons/fi";
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
      <Text color="gray.500">No tracks in playlist yet.</Text>
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
                <Button variant="outline" size="xs">
                  <FiMoreVertical size={16} />
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item
                      onSelect={() => moveTrack(idx, idx - 1)}
                      value="up"
                      disabled={idx === 0}
                    //   icon={
                    //     <Icon as={FiArrowUp} color="#3182ce" boxSize={4} />
                    //   }
                    >
                      Move Up
                    </Menu.Item>
                    <Menu.Item
                      onSelect={() => moveTrack(idx, idx + 1)}
                      value="down"
                      disabled={idx === playlist.length - 1}
                    //   icon={
                    //     <Icon as={FiArrowDown} color="#4A5568" boxSize={4} />
                    //   }
                    >
                      Move Down
                    </Menu.Item>
                    <Menu.Item
                      onSelect={() => setEditTrack(track)}
                      value="edit"
                    //   icon={<Icon as={FiEdit} color="black" boxSize={4} />}
                    >
                      Edit
                    </Menu.Item>
                    <Menu.Item
                      onSelect={() => removeFromPlaylist(track.track_id)}
                      value="remove"
                    //   icon={<Icon as={FiTrash2} color="red.500" boxSize={4} />}
                    >
                      Remove
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>,
          ]}
        />
      ))
    )}
  </Box>
);

export default PlaylistViewer;
