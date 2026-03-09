"use client";

import React, { useState } from "react";
import { Button, Menu, Dialog, Portal, Flex } from "@chakra-ui/react";
import {
  FiArrowDown,
  FiArrowUp,
  FiClock,
  FiDownload,
  FiEdit,
  FiMoreVertical,
  FiPlus,
  FiTrash,
  FiZap,
} from "react-icons/fi";
import type { Track } from "@/types/track";
import { useAddToPlaylistDialog } from "@/hooks/useAddToPlaylistDialog";
import PlaylistRecommendations from "./PlaylistRecommendations";
import { analyzeTrackAsync, recalcTrackDuration, vectorizeTrack } from "@/services/internalApi/tracks";
import { cleanSoundcloudUrl } from "@/lib/url";
import { toaster } from "@/components/ui/toaster";
import { useTrackStore } from "@/stores/trackStore";

export interface PlaylistItemMenuProps {
  idx: number;
  total: number;
  track: Track;
  moveTrack: (fromIdx: number, toIdx: number) => void;
  removeFromPlaylist: (indexToRemove: number) => void;
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
  const { openForTrack, playlistDialog } = useAddToPlaylistDialog();
  const isFirst = idx === 0;
  const isLast = idx === total - 1;

  const [recommendationsModalOpen, setRecommendationsModalOpen] = useState(false);
  const [recommendationsTrackSnapshot, setRecommendationsTrackSnapshot] = useState<Track[]>([]);
  const [fetchAudioLoading, setFetchAudioLoading] = useState(false);
  const [vectorizeLoading, setVectorizeLoading] = useState(false);
  const [durationLoading, setDurationLoading] = useState(false);
  const { updateTrack } = useTrackStore();

  const canFetchAudio =
    !track.local_audio_url &&
    Boolean(track.apple_music_url || track.youtube_url || track.soundcloud_url);
  const canRecalcDuration =
    !!track.local_audio_url && (!track.duration_seconds || track.duration_seconds <= 0);
  const t = track as Track & {
    _vectors?: { default?: number[] };
    embedding?: string | number[] | null;
  };
  let hasEmbedding = false;
  const embeddingRaw = t._vectors?.default ?? t.embedding;
  if (Array.isArray(embeddingRaw)) {
    hasEmbedding = embeddingRaw.length > 0;
  } else if (typeof embeddingRaw === "string") {
    try {
      const parsed = JSON.parse(embeddingRaw) as unknown;
      hasEmbedding = Array.isArray(parsed) && parsed.length > 0;
    } catch {
      hasEmbedding = embeddingRaw.length > 0;
    }
  }
  const canVectorize = !hasEmbedding;

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
  const handleVectorize = async () => {
    if (!track.friend_id) {
      toaster.create({ title: "Track missing friend_id", type: "error" });
      return;
    }
    setVectorizeLoading(true);
    try {
      const res = await vectorizeTrack({ track_id: track.track_id, friend_id: track.friend_id });
      const patch = {
        track_id: track.track_id,
        friend_id: track.friend_id,
        embedding: res.embedding,
        _vectors: { default: res.embedding },
        hasVectors: true,
      };
      updateTrack(track.track_id, track.friend_id, patch);
      toaster.create({
        title: "Track vectorized",
        type: "success",
      });
    } catch (err) {
      toaster.create({
        title: "Failed to vectorize",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setVectorizeLoading(false);
    }
  };

  const handleRecalcDuration = async () => {
    if (!track.friend_id) {
      toaster.create({ title: "Track missing friend_id", type: "error" });
      return;
    }
    setDurationLoading(true);
    try {
      const res = await recalcTrackDuration({
        track_id: track.track_id,
        friend_id: track.friend_id,
      });
      toaster.create({
        title: "Duration recalculation queued",
        description: `Job ID: ${res.jobId}`,
        type: "success",
      });
    } catch (err) {
      toaster.create({
        title: "Failed to recalculate duration",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setDurationLoading(false);
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
            <Menu.Item onSelect={() => openTrackEditor(track)} value="edit">
              <FiEdit />
              Edit
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
            {canRecalcDuration && (
                <Menu.Item
                  onSelect={handleRecalcDuration}
                  value="recalc-duration"
                  disabled={durationLoading}
                >
                  <FiClock />
                  {durationLoading ? "Queueing..." : "Recalculate Duration"}
                </Menu.Item>
              )}
            {canVectorize && (
              <Menu.Item
                onSelect={handleVectorize}
                value="vectorize"
                disabled={vectorizeLoading}
              >
                <FiZap />
                {vectorizeLoading ? "Vectorizing..." : "Vectorize Track"}
              </Menu.Item>
            )}
            <Menu.Item
              onSelect={() => {
                setRecommendationsTrackSnapshot([track]);
                setRecommendationsModalOpen(true);
              }}
              value="recommendations"
            >
              <FiZap /> AI Recommendations
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
                    onEditTrack={openTrackEditor}
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
