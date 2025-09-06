"use client";

import React from "react";
import { Checkbox, Spinner, Table, Text } from "@chakra-ui/react";
import type { BackfillTrack } from "./types";

type Props = {
  tracks: BackfillTrack[];
  selected: Set<string>;
  analyzing: boolean;
  onToggleOne: (trackId: string) => void;
  onToggleAll: () => void;
};

export default function BackfillTable({ tracks, selected, analyzing, onToggleOne, onToggleAll }: Props) {
  if (tracks.length === 0) return null;

  const allSelected = selected.size === tracks.length && tracks.length > 0;
  return (
    <Table.ScrollArea borderWidth="1px" maxHeight={["calc(100vh - 400px)", "calc(100vh - 300px)"]}>
      <Table.Root size="sm" variant="outline" showColumnBorder fontSize={["xs", "sm", "sm"]}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader width={"5%"}>
              <Checkbox.Root
                checked={allSelected}
                onChange={onToggleAll}
                disabled={analyzing || tracks.length === 0}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
              </Checkbox.Root>
            </Table.ColumnHeader>
            <Table.ColumnHeader width={"45%"}>Title</Table.ColumnHeader>
            <Table.ColumnHeader width={"25%"}>Artist</Table.ColumnHeader>
            <Table.ColumnHeader width={"13%"}>Source</Table.ColumnHeader>
            <Table.ColumnHeader width={"12%"}>Status</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {tracks.map((track) => (
            <Table.Row key={track.id} data-selected={selected.has(track.track_id) ? "" : undefined}>
              <Table.Cell>
                <Checkbox.Root
                  checked={selected.has(track.track_id)}
                  onChange={() => onToggleOne(track.track_id)}
                  disabled={analyzing}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                </Checkbox.Root>
              </Table.Cell>
              <Table.Cell maxW="220px">
                <Text truncate title={track.title}>
                  {track.title}
                </Text>
              </Table.Cell>
              <Table.Cell maxW="140px">
                <Text truncate title={track.artist}>
                  {track.artist}
                </Text>
              </Table.Cell>
              <Table.Cell>
                {track.apple_music_url ? (
                  <a href={track.apple_music_url} target="_blank" rel="noopener noreferrer">
                    Apple
                  </a>
                ) : track.youtube_url ? (
                  <a href={track.youtube_url} target="_blank" rel="noopener noreferrer">
                    Youtube
                  </a>
                ) : track.soundcloud_url ? (
                  <a href={track.soundcloud_url} target="_blank" rel="noopener noreferrer">
                    SoundCloud
                  </a>
                ) : track.spotify_url ? (
                  <a href={track.spotify_url} target="_blank" rel="noopener noreferrer">
                    Spotify
                  </a>
                ) : (
                  <Text color="gray.400">—</Text>
                )}
              </Table.Cell>
              <Table.Cell>
                {track.status === "analyzing" ? (
                  <Spinner size="xs" />
                ) : track.status === "success" ? (
                  <Text color="green.500">✓</Text>
                ) : track.status === "error" ? (
                  <Text color="red.500">{track.errorMsg || "Error"}</Text>
                ) : (
                  <Text color="gray.400">—</Text>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
