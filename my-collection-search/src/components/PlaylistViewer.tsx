import React from "react";
import { Box, Text, MenuItem, Icon } from "@chakra-ui/react";
import { FiArrowUp, FiArrowDown, FiEdit, FiTrash2 } from "react-icons/fi";
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
            <MenuItem
              key="up"
              onClick={() => moveTrack(idx, idx - 1)}
              disabled={idx === 0}
              icon={<Icon as={FiArrowUp} color="#3182ce" boxSize={4} />}
              color="#3182ce"
            >
              Move Up
            </MenuItem>,
            <MenuItem
              key="down"
              onClick={() => moveTrack(idx, idx + 1)}
              disabled={idx === playlist.length - 1}
              icon={<Icon as={FiArrowDown} color="#4A5568" boxSize={4} />}
              color="#4A5568"
            >
              Move Down
            </MenuItem>,
            <MenuItem
              key="edit"
              onClick={() => setEditTrack(track)}
              icon={<Icon as={FiEdit} color="black" boxSize={4} />}
              color="black"
            >
              Edit
            </MenuItem>,
            <MenuItem
              key="remove"
              onClick={() => removeFromPlaylist(track.track_id)}
              icon={<Icon as={FiTrash2} color="red.500" boxSize={4} />}
              color="red.500"
            >
              Remove
            </MenuItem>,
          ]}
        />
      ))
    )}
  </Box>
);

export default PlaylistViewer;
