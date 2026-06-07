"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import { Button, Menu, Dialog, Portal, Flex } from "@chakra-ui/react";
import {
  FiArrowDown,
  FiArrowUp,
  FiDownload,
  FiEdit,
  FiMoreVertical,
  FiPlus,
  FiTrash,
} from "react-icons/fi";
import type { Track } from "@/types/track";
import { useAddToPlaylistDialog } from "@/hooks/useAddToPlaylistDialog";
import PlaylistRecommendations from "./PlaylistRecommendations";
import { analyzeTrackAsync } from "@/services/internalApi/tracks";
import { cleanSoundcloudUrl } from "@/lib/url";
import { toaster } from "@/components/ui/toaster";

export interface PlaylistItemMenuProps {
  idx: number;
  total: number;
  track: Track;
  moveTrack: (fromIdx: number, toIdx: number) => void;
  removeFromPlaylist: (indexToRemove: number) => void;
  size?: "xs" | "sm" | "md" | "lg";
}

export const PlaylistItemMenu: React.FC<PlaylistItemMenuProps> = ({
  idx,
  total,
  track,
  moveTrack,
  removeFromPlaylist,
  size = "xs",
}) => {
  const { openForTrack, playlistDialog } = useAddToPlaylistDialog();
  const isFirst = idx === 0;
  const isLast = idx === total - 1;

  const [recommendationsModalOpen, setRecommendationsModalOpen] = useState(false);
  const [recommendationsTrackSnapshot, setRecommendationsTrackSnapshot] = useState<Track[]>([]);
  const [fetchAudioLoading, setFetchAudioLoading] = useState(false);

  const canFetchAudio =
    !track.local_audio_url &&
    Boolean(track.apple_music_url || track.youtube_url || track.soundcloud_url);

  const handleFetchAudio = async () => {
    if (!track.friend_id) {
      toaster.create({ title: "Track missing friend_id", type: "error" });
      return;
    }
    setFetchAudioLoading(true);
    try {
      const response = await analyzeTrackAsync({
        track_id: track.track_id,
        friend_id: track.friend_id,
        apple_music_url: track.apple_music_url,
        youtube_url: track.youtube_url,
        soundcloud_url: cleanSoundcloudUrl(track.soundcloud_url),
        title: track.title,
        artist: track.artist,
      });
      toaster.create({
        title: "Audio Fetch Queued",
        description: `Job ID: ${response.jobId}`,
        type: "success",
      });
    } catch (err) {
      toaster.create({
        title: "Failed to queue audio fetch",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setFetchAudioLoading(false);
    }
  };
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
            <Menu.Item value="edit" asChild>
              <NextLink href={`/tracks/${encodeURIComponent(track.track_id)}/edit?friend_id=${track.friend_id}`}>
                <FiEdit />
                Edit
              </NextLink>
            </Menu.Item>
            <Menu.Item onSelect={() => openForTrack(track)} value="add">
              <FiPlus /> Add to Playlist
            </Menu.Item>
            {canFetchAudio && (
              <Menu.Item
                onSelect={handleFetchAudio}
                value="fetch-audio"
                disabled={fetchAudioLoading}
              >
                <FiDownload />
                {fetchAudioLoading ? "Fetching Audio..." : "Fetch Audio"}
              </Menu.Item>
            )}
            <Menu.Item
              onSelect={() => {
                setRecommendationsTrackSnapshot([track]);
                setRecommendationsModalOpen(true);
              }}
              value="recommendations"
            >
              <FiPlus /> AI Recommendations
            </Menu.Item>
            <Menu.Item
              onSelect={() => removeFromPlaylist(idx)}
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
      {playlistDialog}

      {/* AI Recommendations Modal */}
      <Dialog.Root
        open={recommendationsModalOpen}
        onOpenChange={(e) => setRecommendationsModalOpen(e.open)}
        size="xl"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Flex justify="space-between" align="center" width="100%">
                  <Dialog.Title>AI Recommendations for {track.title}</Dialog.Title>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRecommendationsTrackSnapshot([track])}
                    mr={8}
                  >
                    Refresh
                  </Button>
                </Flex>
              </Dialog.Header>
              <Dialog.Body maxH="70vh" overflowY="auto">
                {recommendationsModalOpen && (
                  <PlaylistRecommendations
                    playlist={recommendationsTrackSnapshot}
                    limit={50}
                    onAddToPlaylist={(t) => openForTrack(t)}
                  />
                )}
              </Dialog.Body>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
};

export default PlaylistItemMenu;
