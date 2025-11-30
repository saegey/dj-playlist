"use client";

import React from "react";
import { Button, Menu } from "@chakra-ui/react";
import {
  FiArrowDown,
  FiArrowUp,
  FiEdit,
  FiMoreVertical,
  FiPlus,
  FiTrash,
} from "react-icons/fi";
import type { Track } from "@/types/track";
import { useAddToPlaylistDialog } from "@/hooks/useAddToPlaylistDialog";

export interface PlaylistItemMenuProps {
  idx: number;
  total: number;
  track: Track;
  moveTrack: (fromIdx: number, toIdx: number) => void;
  removeFromPlaylist: (trackId: string) => void;
  openTrackEditor: (track: Track) => void;
  size?: "xs" | "sm" | "md" | "lg";
}

export const PlaylistItemMenu: React.FC<PlaylistItemMenuProps> = ({
  idx,
  total,
  track,
  moveTrack,
  removeFromPlaylist,
  openTrackEditor,
  size = "xs",
}) => {
  const { openForTrack, PlaylistDialog, NameDialog } = useAddToPlaylistDialog();
  const isFirst = idx === 0;
  const isLast = idx === total - 1;
  return (
    <>
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button variant="plain" size={size}>
            <FiMoreVertical size={16} />
          </Button>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item
              onSelect={() => moveTrack(idx, idx - 1)}
              value="up"
              disabled={isFirst}
            >
              <FiArrowUp />
              Move Up
            </Menu.Item>
            <Menu.Item
              onSelect={() => moveTrack(idx, idx + 1)}
              value="down"
              disabled={isLast}
            >
              <FiArrowDown />
              Move Down
            </Menu.Item>
            <Menu.Item onSelect={() => openTrackEditor(track)} value="edit">
              <FiEdit />
              Edit
            </Menu.Item>
            <Menu.Item onSelect={() => openForTrack(track)} value="add">
              <FiPlus /> Add to Playlist
            </Menu.Item>
            <Menu.Item
              onSelect={() => removeFromPlaylist(track.track_id)}
              value="delete"
              color="fg.error"
              _hover={{ bg: "bg.error", color: "fg.error" }}
            >
              <FiTrash />
              Remove
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
      <PlaylistDialog />
    </>
  );
};

export default PlaylistItemMenu;
