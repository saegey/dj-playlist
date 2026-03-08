"use client";

import React, { useState } from "react";
import { Button, Menu, Portal, Dialog, Flex, Box, Icon, Link } from "@chakra-ui/react";
import { FiCalendar, FiClock, FiDownload, FiEdit, FiMoreVertical, FiPlus, FiPlusSquare, FiZap, FiTarget } from "react-icons/fi";
import { SiApplemusic, SiYoutube, SiSoundcloud } from "react-icons/si";

import type { Track } from "@/types/track";
import { useTrackEditor } from "@/providers/TrackEditProvider";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { useAddToPlaylistDialog } from "@/hooks/useAddToPlaylistDialog";
import PlaylistRecommendations from "./PlaylistRecommendations";
import SimilarTracks from "./SimilarTracks";
import SimilarVibeTracks from "./SimilarVibeTracks";
import { analyzeLocalAudioAsync, analyzeTrackAsync, recalcTrackDuration, syncTrackYearFromAudio } from "@/services/internalApi/tracks";
import { cleanSoundcloudUrl } from "@/lib/url";
import { toaster } from "@/components/ui/toaster";
import posthog from "posthog-js";

type Props = {
  track: Track;
};

export default function TrackActionsMenu({ track }: Props) {
  const { openTrackEditor } = useTrackEditor();
  const { appendToQueue } = usePlaylistPlayer();
  const { openForTrack, playlistDialog, nameDialog } = useAddToPlaylistDialog();

  const [recommendationsModalOpen, setRecommendationsModalOpen] = useState(false);
  const [recommendationsTrackSnapshot, setRecommendationsTrackSnapshot] = useState<Track[]>([]);
  const [similarTracksModalOpen, setSimilarTracksModalOpen] = useState(false);
  const [similarVibeModalOpen, setSimilarVibeModalOpen] = useState(false);
  const [fetchAudioLoading, setFetchAudioLoading] = useState(false);
  const [durationLoading, setDurationLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [syncYearLoading, setSyncYearLoading] = useState(false);

  const canFetchAudio =
    !track.local_audio_url &&
    Boolean(track.apple_music_url || track.youtube_url || track.soundcloud_url);
  const canAnalyze =
    !!track.local_audio_url ||
    Boolean(track.apple_music_url || track.youtube_url || track.soundcloud_url);
  const canRecalcDuration =
    !!track.local_audio_url && (!track.duration_seconds || track.duration_seconds <= 0);
  const canSyncYearFromAudio = !!track.local_audio_url;

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

  const handleAnalyzeTrack = async () => {
    if (!track.friend_id) {
      toaster.create({ title: "Track missing friend_id", type: "error" });
      return;
    }
    setAnalyzeLoading(true);
    try {
      const response = track.local_audio_url
        ? await analyzeLocalAudioAsync({
            track_id: track.track_id,
            friend_id: track.friend_id,
            local_audio_url: track.local_audio_url,
          })
        : await analyzeTrackAsync({
            track_id: track.track_id,
            friend_id: track.friend_id,
            apple_music_url: track.apple_music_url,
            youtube_url: track.youtube_url,
            soundcloud_url: cleanSoundcloudUrl(track.soundcloud_url),
            title: track.title,
            artist: track.artist,
          });

      toaster.create({
        title: "Analysis queued",
        description: `Job ID: ${response.jobId}`,
        type: "success",
      });
    } catch (err) {
      toaster.create({
        title: "Failed to queue analysis",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const handleSyncYearFromAudio = async () => {
    if (!track.friend_id) {
      toaster.create({ title: "Track missing friend_id", type: "error" });
      return;
    }
    setSyncYearLoading(true);
    try {
      const response = await syncTrackYearFromAudio({
        track_id: track.track_id,
        friend_id: track.friend_id,
      });
      toaster.create({
        title: "Track year synced from audio",
        description:
          response.previous_year && String(response.previous_year) !== response.year
            ? `Updated ${response.previous_year} -> ${response.year}`
            : `Year: ${response.year}`,
        type: "success",
      });
    } catch (err) {
      toaster.create({
        title: "Failed to sync year from audio",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setSyncYearLoading(false);
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
              {canAnalyze && (
                <Menu.Item
                  onSelect={handleAnalyzeTrack}
                  value="analyze-track"
                  disabled={analyzeLoading}
                >
                  <FiZap />
                  {analyzeLoading ? "Queueing Analysis..." : "Analyze Track"}
                </Menu.Item>
              )}
              {canSyncYearFromAudio && (
                <Menu.Item
                  onSelect={handleSyncYearFromAudio}
                  value="sync-audio-year"
                  disabled={syncYearLoading}
                >
                  <FiCalendar />
                  {syncYearLoading ? "Syncing Year..." : "Sync Year from Audio Tags"}
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

              <Menu.Item
                onSelect={() => {
                  setSimilarTracksModalOpen(true);

                  // PostHog: Track similar tracks requested
                  posthog.capture("similar_tracks_requested", {
                    track_id: track.track_id,
                    track_title: track.title,
                    track_artist: track.artist,
                    source: "track_menu",
                  });
                }}
                value="similar-tracks"
              >
                <FiTarget /> Similar Tracks
              </Menu.Item>

              <Menu.Item
                onSelect={() => {
                  setSimilarVibeModalOpen(true);

                  // PostHog: Track similar vibe requested
                  posthog.capture("similar_vibe_requested", {
                    track_id: track.track_id,
                    track_title: track.title,
                    track_artist: track.artist,
                    source: "track_menu",
                  });
                }}
                value="similar-vibe"
              >
                <FiTarget /> Similar Vibe
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

      {/* Similar Tracks Modal */}
      <Dialog.Root
        open={similarTracksModalOpen}
        onOpenChange={(e) => setSimilarTracksModalOpen(e.open)}
        size="xl"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Similar Tracks: {track.title}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body maxH="70vh" overflowY="auto">
                {similarTracksModalOpen && <SimilarTracks track={track} limit={50} />}
              </Dialog.Body>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Similar Vibe Modal */}
      <Dialog.Root
        open={similarVibeModalOpen}
        onOpenChange={(e) => setSimilarVibeModalOpen(e.open)}
        size="xl"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Similar Vibe: {track.title}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body maxH="70vh" overflowY="auto">
                {similarVibeModalOpen && <SimilarVibeTracks track={track} limit={50} />}
              </Dialog.Body>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
