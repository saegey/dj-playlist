"use client";

import React from "react";
import { Button, Menu, Portal } from "@chakra-ui/react";
import { FiMoreVertical } from "react-icons/fi";
import type { Track } from "@/types/track";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useTrackEditor } from "@/providers/TrackEditProvider";

type Props = {
  track: Track;
};

export default function TrackActionsMenu({ track }: Props) {
  const { addToPlaylist } = usePlaylists();
  const { openTrackEditor } = useTrackEditor();

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant="plain" size={["xs", "sm", "md"]}>
          <FiMoreVertical />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item onSelect={() => addToPlaylist(track)} value="add">
              Add to Playlist
            </Menu.Item>
            <Menu.Item onSelect={() => openTrackEditor(track)} value="edit">
              Edit Track
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
