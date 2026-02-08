"use client";

import React, { useState } from "react";
import { Button, Menu, Portal, Dialog, Flex, Box, Icon, Link } from "@chakra-ui/react";
import { FiDownload, FiEdit, FiMoreVertical, FiPlus, FiPlusSquare, FiZap } from "react-icons/fi";
import { SiApplemusic, SiSpotify, SiYoutube, SiSoundcloud } from "react-icons/si";

import type { Track } from "@/types/track";
import { useTrackEditor } from "@/providers/TrackEditProvider";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { useAddToPlaylistDialog } from "@/hooks/useAddToPlaylistDialog";
import PlaylistRecommendations from "./PlaylistRecommendations";
import { analyzeTrackAsync } from "@/services/trackService";
import { cleanSoundcloudUrl } from "@/lib/url";
import { toaster } from "@/components/ui/toaster";
import posthog from "posthog-js";

type Props = {
  track: Track;
};

export default function TrackActionsMenu({ track }: Props) {
  const { openTrackEditor } = useTrackEditor();
  const { appendToQueue } = usePlaylistPlayer();
  const { openForTrack, PlaylistDialog, NameDialog } = useAddToPlaylistDialog();

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
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item onSelect={() => openForTrack(track)} value="add">
                <FiPlus /> Add to Playlist
              </Menu.Item>
              <Menu.Item onSelect={() => openTrackEditor(track)} value="edit">
                <FiEdit /> Edit Track
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
              <Menu.Item
                onSelect={() => {
                  setRecommendationsTrackSnapshot([track]);
                  setRecommendationsModalOpen(true);

                  // PostHog: Track AI recommendations requested
                  posthog.capture("ai_recommendations_requested", {
                    track_id: track.track_id,
                    track_title: track.title,
                    track_artist: track.artist,
                    source: "track_menu",
                  });
                }}
                value="recommendations"
              >
                <FiZap /> AI Recommendations
              </Menu.Item>

              {/* Music Service Links */}
              {(track.apple_music_url || track.spotify_url || track.youtube_url || track.soundcloud_url) && (
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
                  {track.spotify_url && (
                    <Menu.Item value="spotify" asChild>
                      <Link href={track.spotify_url} target="_blank" rel="noopener noreferrer">
                        <Icon as={SiSpotify} /> Spotify
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
        </Portal>
      </Menu.Root>

      {/* Dialog components */}
      <PlaylistDialog />
      <NameDialog />

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
}
