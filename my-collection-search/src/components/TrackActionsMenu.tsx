"use client";

import React from "react";
import { Button, Menu, Portal } from "@chakra-ui/react";
import { FiEdit, FiMoreVertical, FiPlus, FiPlusSquare } from "react-icons/fi";

import type { Track } from "@/types/track";
import { usePlaylists } from "@/providers/PlaylistsProvider";
import { useTrackEditor } from "@/providers/TrackEditProvider";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";

type Props = {
  track: Track;
};

export default function TrackActionsMenu({ track }: Props) {
  const { addToPlaylist } = usePlaylists();
  const { openTrackEditor } = useTrackEditor();
  const { appendToQueue } = usePlaylistPlayer();

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant="outline" size={["xs", "sm", "sm"]}>
          <FiMoreVertical />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item onSelect={() => addToPlaylist(track)} value="add">
              <FiPlus /> Add to Playlist
            </Menu.Item>
            <Menu.Item onSelect={() => openTrackEditor(track)} value="edit">
              <FiEdit /> Edit Track
            </Menu.Item>
            <Menu.Item onSelect={() => appendToQueue(track)} value="queue">
              <FiPlusSquare /> Add to Queue
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
