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
import { useAsyncAnalyzeTrackMutation } from "@/hooks/useAsyncAnalyzeTrackMutation";
import { useUploadTrackAudioMutation } from "@/hooks/useUploadTrackAudioMutation";
import { buildTrackMetadataPrompt } from "@/lib/prompts";
import { useTrackMetadataMutation } from "@/hooks/useTrackMetadataMutation";
import { useYouTubeMusicSearchMutation } from "@/hooks/useYouTubeMusicSearchMutation";
import { toaster } from "@/components/ui/toaster";
import DiscogsVideosModal from "@/components/DiscogsVideosModal";
import { lookupDiscogsVideos, extractDiscogsVideos } from "@/services/discogsService";
import { DiscogsVideo } from "@/services/discogsApiClient";

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
  friend_id: number;
  local_audio_url?: string | null;
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
    friend_id: track?.friend_id,
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
      friend_id: track.friend_id,
    });
  }, [track]);

  const [youtubeResults, setYoutubeResults] = useState<YoutubeVideo[]>([]);
  const { mutateAsync: searchYouTubeMusic, isPending: youtubeLoading } =
    useYouTubeMusicSearchMutation();
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showRemoveAudioConfirm, setShowRemoveAudioConfirm] = useState(false);
  const [removeAudioLoading, setRemoveAudioLoading] = useState(false);

  // Discogs state
  const [discogsVideos, setDiscogsVideos] = useState<DiscogsVideo[] | null>(null);
  const [showDiscogsModal, setShowDiscogsModal] = useState(false);
  const [discogsLoading, setDiscogsLoading] = useState(false);

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
  const { mutateAsync: analyze, isPending: analyzeLoading } =
    useAsyncAnalyzeTrackMutation();
  const { mutateAsync: uploadAudio, isPending: uploadLoading } =
    useUploadTrackAudioMutation();
  const { mutateAsync: fetchMetadata, isPending: aiLoading } =
    useTrackMetadataMutation();

  const handleFileUpload = async (selectedFile: File) => {
    try {
      const { analysis: data } = await uploadAudio({
        file: selectedFile,
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

      toaster.create({
        title: "Upload Successful",
        description: "Audio file uploaded and analyzed",
        type: "success",
      });
    } catch (err) {
      toaster.create({
        title: "Upload Failed",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      if (!form.friend_id) {
        throw new Error("Track is missing friend_id");
      }
      // Strip query params from soundcloud_url if present
      const cleanForm = {
        ...form,
        soundcloud_url: cleanSoundcloudUrl(form.soundcloud_url),
        bpm: Number(form.bpm) || null,
        key: form.key || null,
        danceability: Number(form.danceability) || null,
        duration_seconds: Number(form.duration_seconds) || null,
        friend_id: form.friend_id,
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

  const searchYouTube = async (title?: string, artist?: string) => {
    setShowYoutubeModal(true);
    setYoutubeResults([]);

    const searchTitle = title || form.title;
    const searchArtist = artist || form.artist;

    // Only search if both title and artist are non-empty
    if (!searchTitle || !searchArtist || searchTitle.trim() === '' || searchArtist.trim() === '') {
      return;
    }

    try {
      const data = await searchYouTubeMusic({
        title: searchTitle,
        artist: searchArtist,
      });
      setYoutubeResults(data.results || []);
    } catch (err) {
      console.error("YouTube search error:", err);
      alert("YouTube search error");
    }
  };

  const handleYouTubeSearch = (title: string, artist: string) => {
    searchYouTube(title, artist);
  };

  const searchSpotify = async () => {
    await spotifyPicker.search({ title: form.title, artist: form.artist });
  };

  const searchDiscogs = async () => {
    if (!track?.track_id) {
      toaster.create({
        title: "Cannot search Discogs",
        description: "Track ID is missing",
        type: "error",
      });
      return;
    }

    setShowDiscogsModal(true);
    setDiscogsLoading(true);
    try {
      const result = await lookupDiscogsVideos(track.track_id);
      const videos = extractDiscogsVideos(result);
      setDiscogsVideos(videos);

      if (videos.length === 0) {
        toaster.create({
          title: "No videos found",
          description: "No Discogs videos found for this release",
          type: "warning",
        });
      }
    } catch (err) {
      console.error("Discogs search error:", err);
      toaster.create({
        title: "Discogs search error",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
      setDiscogsVideos([]);
    } finally {
      setDiscogsLoading(false);
    }
  };

  const handleDiscogsVideoSelect = (url: string) => {
    // Discogs videos are YouTube URLs, save to youtube_url field
    setForm((prev) => ({ ...prev, youtube_url: url }));
    setShowDiscogsModal(false);
    toaster.create({
      title: "YouTube URL Added",
      description: "Discogs video URL saved to YouTube field",
      type: "success",
    });
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
      if (!form.friend_id) {
        throw new Error("Track is missing friend_id");
      }
      const response = await analyze({
        apple_music_url: form.apple_music_url,
        youtube_url: form.youtube_url,
        soundcloud_url: cleanSoundcloudUrl(form.soundcloud_url),
        track_id: form.track_id,
        friend_id: form.friend_id,
        spotify_url: form.spotify_url,
      });
      console.log("Analysis job queued:", response);

      toaster.create({
        title: "Audio Analysis Queued",
        description: `Job ID: ${response.jobId}. The track will be analyzed automatically. Check the Job Queue for progress.`,
        type: "success",
      });
    } catch (err) {
      console.error("Audio analysis error:", err);
      toaster.create({
        title: "Audio Analysis Failed",
        description: "Error queuing audio analysis: " + (err instanceof Error ? err.message : err),
        type: "error",
      });
    }
  };

  const handleRemoveAudioClick = () => {
    setShowRemoveAudioConfirm(true);
  };

  const handleRemoveAudioConfirm = async () => {
    setRemoveAudioLoading(true);
    try {
      if (!form.friend_id) {
        throw new Error("Track is missing friend_id");
      }

      // Call onSave with local_audio_url set to null to remove it
      await Promise.resolve(
        onSave({
          ...form,
          bpm: Number(form.bpm) || null,
          key: form.key || null,
          danceability: Number(form.danceability) || null,
          duration_seconds: Number(form.duration_seconds) || null,
          friend_id: form.friend_id,
          soundcloud_url: cleanSoundcloudUrl(form.soundcloud_url),
          local_audio_url: null,
        })
      );

      toaster.create({
        title: "Audio Removed",
        description: "Local audio file has been removed",
        type: "success",
      });

      setShowRemoveAudioConfirm(false);
    } catch (err) {
      toaster.create({
        title: "Remove Audio Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "error",
      });
    } finally {
      setRemoveAudioLoading(false);
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
    discogsLoading: discogsLoading,
    onSearchDiscogs: searchDiscogs,
    analyzeLoading: analyzeLoading,
    onAnalyzeAudio: handleAnalyzeAudio,
    uploadLoading: uploadLoading,
    onFileSelected: (file) => {
      if (file) {
        handleFileUpload(file);
      }
    },
    hasAudio: !!track?.local_audio_url,
    onRemoveAudio: handleRemoveAudioClick,
    removeAudioLoading: removeAudioLoading,
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
                    initialTitle={form.title}
                    initialArtist={form.artist}
                    onSearch={handleYouTubeSearch}
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

                  {/* --- Discogs Videos Dialog --- */}
                  <DiscogsVideosModal
                    open={showDiscogsModal}
                    onClose={() => setShowDiscogsModal(false)}
                    videos={discogsVideos}
                    loading={discogsLoading}
                    trackTitle={form.title}
                    trackArtist={form.artist}
                    trackAlbum={form.album}
                    onVideoSelect={handleDiscogsVideoSelect}
                  />

                  {/* --- Remove Audio Confirmation Dialog --- */}
                  <Dialog.Root
                    open={showRemoveAudioConfirm}
                    onOpenChange={(d) => setShowRemoveAudioConfirm(d.open)}
                  >
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                      <Dialog.Content>
                        <Dialog.Header>
                          <Dialog.Title>Remove Audio</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                          <Text>
                            Are you sure you want to remove the local audio file? This
                            action cannot be undone.
                          </Text>
                        </Dialog.Body>
                        <Dialog.Footer>
                          <Button
                            variant="outline"
                            onClick={() => setShowRemoveAudioConfirm(false)}
                            disabled={removeAudioLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            colorPalette="red"
                            onClick={handleRemoveAudioConfirm}
                            loading={removeAudioLoading}
                            disabled={removeAudioLoading}
                          >
                            Remove
                          </Button>
                        </Dialog.Footer>
                      </Dialog.Content>
                    </Dialog.Positioner>
                  </Dialog.Root>
                </Box>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
