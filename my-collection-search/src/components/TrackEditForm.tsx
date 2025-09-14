"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Text,
  Stack,
  Flex,
  Portal,
  Dialog,
  CloseButton,
  RatingGroup,
} from "@chakra-ui/react";
import LabeledInput from "@/components/form/LabeledInput";
import LabeledTextarea from "@/components/form/LabeledTextarea";

import { YoutubeVideo } from "@/types/track";
// icons used within extracted components
import { useAppleMusicPicker } from "@/hooks/useAppleMusicPicker";
import AppleMusicPickerDialog from "@/components/AppleMusicPickerDialog";
import { cleanSoundcloudUrl } from "@/lib/url";
import { useSpotifyPicker } from "@/hooks/useSpotifyPicker";
import SpotifyPickerDialog from "@/components/SpotifyPickerDialog";
import YouTubePickerDialog from "@/components/YouTubePickerDialog";
import TrackEditFormSkeleton from "@/components/TrackEditFormSkeleton";
import { createTrackEditActionsWrapper } from "@/components/TrackEditActionsWrapper";
import { useAnalyzeTrackMutation } from "@/hooks/useAnalyzeTrackMutation";
import { useUploadTrackAudioMutation } from "@/hooks/useUploadTrackAudioMutation";
import { buildTrackMetadataPrompt } from "@/lib/prompts";
import { useTrackMetadataMutation } from "@/hooks/useTrackMetadataMutation";
import { useYouTubeMusicSearchMutation } from "@/hooks/useYouTubeMusicSearchMutation";

export interface TrackEditFormProps {
  track_id: string; // Optional for new tracks
  title?: string;
  artist?: string;
  album?: string;
  local_tags?: string | undefined;
  notes?: string | undefined | null;
  bpm?: number | null;
  key?: string | undefined | null;
  danceability?: number | null;
  apple_music_url?: string;
  spotify_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
  star_rating?: number;
  duration_seconds?: number | null; // Optional for new tracks
  friend_id: number; // Optional friend ID for shared libraries
}

export default function TrackEditForm({
  track,
  onSave,
  dialogOpen,
  setDialogOpen,
  initialFocusRef,
}: {
  track: TrackEditFormProps | null;
  onSave: (data: TrackEditFormProps) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  initialFocusRef: React.RefObject<HTMLButtonElement | null>;
}) {
  // File upload logic
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    track_id: track?.track_id || "",
    album: track?.album || "",
    title: track?.title || "",
    artist: track?.artist || "",
    local_tags: (track?.local_tags as string | undefined) || "",
    notes: (track?.notes as string | undefined) || "",
    bpm: (track?.bpm as string | undefined) || "",
    key: (track?.key as string | undefined) || "",
    danceability: (track?.danceability as string | undefined) || "",
    apple_music_url: track?.apple_music_url || "",
    youtube_url: track?.youtube_url || "",
    spotify_url: track?.spotify_url || "",
    soundcloud_url: track?.soundcloud_url || "",
    star_rating:
      typeof track?.star_rating === "number" ? track!.star_rating : 0,
    duration_seconds: track?.duration_seconds || undefined, // Optional for new tracks
    username: track?.username || "",
  });

  React.useEffect(() => {
    if (!track) return;
    setForm({
      track_id: track.track_id || "",
      album: track.album || "",
      title: track.title || "",
      artist: track.artist || "",
      local_tags: (track.local_tags as string | undefined) || "",
      notes: (track.notes as string | undefined) || "",
      bpm: (track.bpm as string | undefined) || "",
      key: (track.key as string | undefined) || "",
      danceability: (track.danceability as string | undefined) || "",
      apple_music_url: track.apple_music_url || "",
      youtube_url: track.youtube_url || "",
      spotify_url: track.spotify_url || "",
      soundcloud_url: track.soundcloud_url || "",
      star_rating:
        typeof track.star_rating === "number" ? track.star_rating : 0,
      duration_seconds: track.duration_seconds || undefined,
      username: track.username,
    });
  }, [track]);

  const [youtubeResults, setYoutubeResults] = useState<YoutubeVideo[]>([]);
  const { mutateAsync: searchYouTubeMusic, isPending: youtubeLoading } =
    useYouTubeMusicSearchMutation();
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);

  const spotifyPicker = useSpotifyPicker({
    onSelect: (track) => {
      setForm((prev) => ({ ...prev, spotify_url: track.url }));
    },
  });

  const applePicker = useAppleMusicPicker({
    onSelect: (song) => {
      setForm((prev) => ({
        ...prev,
        apple_music_url: song.url,
        duration_seconds: song.duration
          ? Math.round(song.duration / 1000)
          : undefined,
      }));
    },
  });

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { mutateAsync: analyze, isPending: analyzeLoading } =
    useAnalyzeTrackMutation();
  const { mutateAsync: uploadAudio, isPending: uploadLoading } =
    useUploadTrackAudioMutation();
  const { mutateAsync: fetchMetadata, isPending: aiLoading } =
    useTrackMetadataMutation();

  const handleFileUpload = async () => {
    if (!file) return;
    try {
      const { analysis: data } = await uploadAudio({
        file,
        track_id: form.track_id,
      });
      setForm((prev) => ({
        ...prev,
        bpm:
          typeof data.rhythm?.bpm === "number"
            ? String(Math.round(data.rhythm.bpm))
            : prev.bpm,
        key:
          data.tonal?.key_edma?.key && data.tonal?.key_edma?.scale
            ? `${data.tonal.key_edma.key} ${data.tonal.key_edma.scale}`
            : prev.key,
        danceability:
          typeof data.rhythm?.danceability === "number"
            ? data.rhythm.danceability.toFixed(3)
            : prev.danceability,
        duration_seconds:
          typeof data.metadata?.audio_properties?.length === "number"
            ? Math.round(data.metadata.audio_properties.length)
            : prev.duration_seconds,
      }));
    } catch (err) {
      alert("Upload failed: " + (err instanceof Error ? err.message : err));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFile(null);
  };

  const handleStarRating = (rating: number) => {
    setForm((prev) => ({ ...prev, star_rating: rating }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Strip query params from soundcloud_url if present
      const cleanForm = {
        ...form,
        soundcloud_url: cleanSoundcloudUrl(form.soundcloud_url),
        bpm: Number(form.bpm) || null,
        key: form.key || null,
        danceability: Number(form.danceability) || null,
        duration_seconds: Number(form.duration_seconds) || null,
      };
      await Promise.resolve(onSave(cleanForm));
    } finally {
      setLoading(false);
    }
  };

  const fetchFromChatGPT = async () => {
    try {
      const prompt = buildTrackMetadataPrompt({
        title: form.title,
        artist: form.artist,
        album: form.album,
      });
      const data = await fetchMetadata({ prompt });
      setForm((prev) => ({
        ...prev,
        local_tags: (data.genre as string) || prev.local_tags,
        notes: (data.notes as string) || prev.notes,
      }));
    } catch {
      alert("Error fetching from AI");
    }
  };

  const searchYouTube = async () => {
    setShowYoutubeModal(true);
    setYoutubeResults([]);
    try {
      const data = await searchYouTubeMusic({
        title: form.title,
        artist: form.artist,
      });
      setYoutubeResults(data.results || []);
    } catch (err) {
      console.error("YouTube search error:", err);
      alert("YouTube search error");
    }
  };

  const searchSpotify = async () => {
    await spotifyPicker.search({ title: form.title, artist: form.artist });
  };

  const handleYoutubeSelect = (video: YoutubeVideo) => {
    setForm((prev) => ({ ...prev, youtube_url: video.url }));
    setShowYoutubeModal(false);
  };

  const searchAppleMusic = async () => {
    await applePicker.search({ title: form.title, artist: form.artist });
  };

  // Apple selection handled via useAppleMusicPicker onSelect

  const handleAnalyzeAudio = async () => {
    try {
      const data = await analyze({
        apple_music_url: form.apple_music_url,
        youtube_url: form.youtube_url,
        soundcloud_url: cleanSoundcloudUrl(form.soundcloud_url),
        track_id: form.track_id,
        spotify_url: form.spotify_url,
      });
      console.log("Analysis result:", data);
      setForm((prev) => ({
        ...prev,
        bpm:
          typeof data.rhythm?.bpm === "number"
            ? String(Math.round(data.rhythm.bpm))
            : prev.bpm,
        key:
          data.tonal?.key_edma?.key && data.tonal?.key_edma?.scale
            ? `${data.tonal.key_edma.key} ${data.tonal.key_edma.scale}`
            : prev.key,
        danceability:
          typeof data.rhythm?.danceability === "number"
            ? data.rhythm.danceability.toFixed(3)
            : prev.danceability,
        duration_seconds:
          typeof data.metadata?.audio_properties?.length === "number"
            ? Math.round(data.metadata.audio_properties.length)
            : prev.duration_seconds,
      }));
    } catch (err) {
      console.error("Audio analysis error:", err);
      alert("Error analyzing audio");
    }
  };

  const TrackEditActionsWrapper = createTrackEditActionsWrapper({
    aiLoading: aiLoading,
    onFetchAI: fetchFromChatGPT,
    appleLoading: applePicker.loading,
    onSearchApple: searchAppleMusic,
    youtubeLoading: youtubeLoading,
    onSearchYouTube: searchYouTube,
    spotifyLoading: spotifyPicker.loading,
    onSearchSpotify: searchSpotify,
    analyzeLoading: analyzeLoading,
    onAnalyzeAudio: handleAnalyzeAudio,
    uploadLoading: uploadLoading,
    onFileSelected: (file) => {
      setFile(file);
      handleFileUpload();
    },
  });

  return (
    <Dialog.Root
      open={dialogOpen}
      onOpenChange={(details) => setDialogOpen(details.open)}
      initialFocusEl={() => initialFocusRef.current}
      role="dialog"
      size={["full", "lg", "lg"]}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Edit Track</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton ref={initialFocusRef} size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              {!track ? (
                <TrackEditFormSkeleton />
              ) : (
                <Box as="form" onSubmit={handleSubmit}>
                  <Flex gap={4} direction="row">
                    <Stack flex={1}>
                      <Box as={"nav"}>
                        <TrackEditActionsWrapper
                          analyzeDisabled={
                            analyzeLoading ||
                            (!form.apple_music_url &&
                              !form.youtube_url &&
                              !form.soundcloud_url &&
                              !form.spotify_url)
                          }
                        />
                      </Box>
                    </Stack>
                  </Flex>

                  <Stack
                    borderWidth="1px"
                    borderRadius="md"
                    padding={4}
                    marginBottom={4}
                    marginTop={4}
                  >
                    <LabeledInput
                      label="Title"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                    />
                    <LabeledInput
                      label="Artist"
                      name="artist"
                      value={form.artist}
                      onChange={handleChange}
                    />
                    <LabeledInput
                      label="Album"
                      name="album"
                      value={form.album}
                      onChange={handleChange}
                    />
                    <Flex gap={2}>
                      <LabeledInput
                        label="BPM"
                        name="bpm"
                        value={form.bpm}
                        onChange={handleChange}
                        type="number"
                      />
                      <LabeledInput
                        label="Key"
                        name="key"
                        value={form.key}
                        onChange={handleChange}
                      />
                      <LabeledInput
                        label="Danceability"
                        name="danceability"
                        value={form.danceability ?? ""}
                        onChange={handleChange}
                        type="number"
                      />
                      <LabeledInput
                        label="Duration (seconds)"
                        name="duration_seconds"
                        value={form.duration_seconds ?? ""}
                        onChange={handleChange}
                        type="number"
                      />
                    </Flex>
                    <LabeledInput
                      label="Genre (comma separated)"
                      name="local_tags"
                      value={form.local_tags}
                      onChange={handleChange}
                    />
                    <LabeledTextarea
                      label="Notes"
                      name="notes"
                      value={form.notes}
                      height={"100px"}
                      onChange={handleChange}
                    />
                    <LabeledInput
                      label="Apple Music URL"
                      name="apple_music_url"
                      value={form.apple_music_url || ""}
                      onChange={handleChange}
                    />
                    <LabeledInput
                      label="YouTube URL"
                      name="youtube_url"
                      value={form.youtube_url || ""}
                      onChange={handleChange}
                    />
                    <LabeledInput
                      label="Spotify URL"
                      name="spotify_url"
                      value={form.spotify_url || ""}
                      onChange={handleChange}
                    />
                    <LabeledInput
                      label="SoundCloud URL"
                      name="soundcloud_url"
                      value={form.soundcloud_url || ""}
                      onChange={handleChange}
                    />

                    <Box>
                      <Text mb={1} fontSize="sm">
                        Rating
                      </Text>
                      <RatingGroup.Root
                        value={form.star_rating}
                        onValueChange={({ value }) => handleStarRating(value)}
                        size="md"
                        count={5}
                      >
                        <RatingGroup.HiddenInput />
                        <RatingGroup.Control />
                      </RatingGroup.Root>
                    </Box>
                  </Stack>
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                    size={"sm"}
                  >
                    Save
                  </Button>

                  <YouTubePickerDialog
                    open={showYoutubeModal}
                    loading={youtubeLoading}
                    results={youtubeResults}
                    onOpenChange={(open) => setShowYoutubeModal(open)}
                    onSelect={(video) => handleYoutubeSelect(video)}
                  />

                  {/* --- Spotify Dialog --- */}
                  <SpotifyPickerDialog
                    open={spotifyPicker.isOpen}
                    loading={spotifyPicker.loading}
                    results={spotifyPicker.results}
                    onOpenChange={(open) =>
                      open ? spotifyPicker.open() : spotifyPicker.close()
                    }
                    onSelect={(t) => spotifyPicker.select(t)}
                  />

                  {/* --- Apple Music Dialog --- */}
                  <AppleMusicPickerDialog
                    open={applePicker.isOpen}
                    onOpenChange={(open) =>
                      open ? applePicker.open() : applePicker.close()
                    }
                    track={track}
                    onSelect={(song) => applePicker.select(song)}
                  />
                </Box>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
