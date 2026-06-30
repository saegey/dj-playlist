"use client";

import React, { useState } from "react";
import { Button, Menu, Portal, Dialog, Box, Icon, Link } from "@chakra-ui/react";
import { FiDownload, FiEdit, FiMoreVertical, FiPlus, FiPlusSquare, FiTrash2 } from "react-icons/fi";
import { useQueryClient } from "@tanstack/react-query";
import { SiApplemusic, SiYoutube, SiSoundcloud } from "react-icons/si";
import NextLink from "next/link";

import type { Track } from "@/types/track";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { useAddToPlaylistDialog } from "@/hooks/useAddToPlaylistDialog";
import { analyzeTrackAsync, softDeleteTrack } from "@/services/internalApi/tracks";
import { cleanSoundcloudUrl } from "@/lib/url";
import { toaster } from "@/components/ui/toaster";
import posthog from "posthog-js";

type Props = {
  track: Track;
};

export default function TrackActionsMenu({ track }: Props) {
  const { appendToQueue } = usePlaylistPlayer();
  const editHref = `/tracks/${encodeURIComponent(track.track_id)}/edit?friend_id=${track.friend_id}`;
  const { openForTrack, playlistDialog, nameDialog } = useAddToPlaylistDialog();
  const queryClient = useQueryClient();

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fetchAudioLoading, setFetchAudioLoading] = useState(false);

  const canFetchAudio =
    !track.local_audio_url &&
    Boolean(track.apple_music_url || track.youtube_url || track.soundcloud_url);

  const handleDeleteConfirm = async () => {
    if (!track.friend_id) {
      toaster.create({ title: "Track missing friend_id", type: "error" });
      return;
    }
    setDeleteLoading(true);
    try {
      await softDeleteTrack({ track_id: track.track_id, friend_id: track.friend_id });
      setDeleteConfirmOpen(false);
      toaster.create({ title: "Track deleted", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
    } catch (err) {
      toaster.create({
        title: "Failed to delete track",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

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

      // PostHog: Track audio fetch queued
      posthog.capture("audio_fetch_queued", {
        track_id: track.track_id,
        has_apple_music: !!track.apple_music_url,
        has_youtube: !!track.youtube_url,
        has_soundcloud: !!track.soundcloud_url,
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
          <Button variant="outline" size={["xs", "sm", "sm"]}>
            <FiMoreVertical />
          </Button>
        </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item onSelect={() => openForTrack(track)} value="add">
                <FiPlus /> Add to Playlist
              </Menu.Item>
              <Menu.Item value="edit" asChild>
                <NextLink href={editHref}>
                  <FiEdit /> Edit Track
                </NextLink>
              </Menu.Item>
              <Menu.Item onSelect={() => appendToQueue(track)} value="queue">
                <FiPlusSquare /> Add to Queue
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
              <Box
                as="hr"
                my={1}
                borderColor="gray.200"
                borderWidth={0}
                borderTopWidth={1}
              />
              <Menu.Item
                onSelect={() => setDeleteConfirmOpen(true)}
                value="delete"
                color="red.500"
              >
                <FiTrash2 /> Delete Track
              </Menu.Item>

              {/* Music Service Links */}
              {(track.apple_music_url || track.youtube_url || track.soundcloud_url) && (
                <>
                  <Box
                    as="hr"
                    my={1}
                    borderColor="gray.200"
                    borderWidth={0}
                    borderTopWidth={1}
                  />
                  {track.apple_music_url && (
                    <Menu.Item value="apple" asChild>
                      <Link href={track.apple_music_url} target="_blank" rel="noopener noreferrer">
                        <Icon as={SiApplemusic} /> Apple Music
                      </Link>
                    </Menu.Item>
                  )}
                  {track.youtube_url && (
                    <Menu.Item value="youtube" asChild>
                      <Link href={track.youtube_url} target="_blank" rel="noopener noreferrer">
                        <Icon as={SiYoutube} /> YouTube
                      </Link>
                    </Menu.Item>
                  )}
                  {track.soundcloud_url && (
                    <Menu.Item value="soundcloud" asChild>
                      <Link href={track.soundcloud_url} target="_blank" rel="noopener noreferrer">
                        <Icon as={SiSoundcloud} /> SoundCloud
                      </Link>
                    </Menu.Item>
                  )}
                </>
              )}
            </Menu.Content>
          </Menu.Positioner>
      </Menu.Root>

      {/* Dialog components */}
      {playlistDialog}
      {nameDialog}

      {/* Delete confirmation */}
      <Dialog.Root
        open={deleteConfirmOpen}
        onOpenChange={(e) => !deleteLoading && setDeleteConfirmOpen(e.open)}
        size="sm"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Delete track?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <strong>{track.title}</strong> by {track.artist} will be soft-deleted and won&apos;t be re-imported from Discogs.
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  onClick={handleDeleteConfirm}
                  loading={deleteLoading}
                >
                  Delete
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
