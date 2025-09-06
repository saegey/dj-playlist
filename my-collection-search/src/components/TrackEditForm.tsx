"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Text,
  Stack,
  Image,
  Flex,
  Portal,
  Dialog,
  CloseButton,
  RatingGroup,
  FileUpload,
  Spinner,
  SimpleGrid,
  Skeleton,
} from "@chakra-ui/react";
import LabeledInput from "@/components/form/LabeledInput";
import LabeledTextarea from "@/components/form/LabeledTextarea";

import { YoutubeVideo } from "@/types/track";
import { HiUpload } from "react-icons/hi";
import { FiDownload } from "react-icons/fi";
import { SiApplemusic, SiChatbot, SiSpotify, SiYoutube } from "react-icons/si";
import { useAppleMusicPicker } from "@/hooks/useAppleMusicPicker";
import AppleMusicPickerDialog from "@/components/AppleMusicPickerDialog";
import { cleanSoundcloudUrl } from "@/lib/url";
import { useSpotifyPicker } from "@/hooks/useSpotifyPicker";
import SpotifyPickerDialog from "@/components/SpotifyPickerDialog";

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
  username: string; // Required for all tracks
}

// SpotifySearchTrack type now lives in hooks/useSpotifyPicker

// moved to lib/url.ts

// Moved LabeledInput and LabeledTextarea into components/form/

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
  const [uploading, setUploading] = useState(false);

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
  const [youtubeLoading, setYoutubeLoading] = useState(false);
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
        duration_seconds: song.duration ? Math.round(song.duration / 1000) : undefined,
      }));
    },
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = async () => {
    // alert("File upload started", JSON.stringify(file));
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("track_id", form.track_id);
      const res = await fetch("/api/tracks/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const response = await res.json();
      const { analysis: data } = response;
      setForm((prev) => ({
        ...prev,
        bpm: data.rhythm.bpm ? String(Math.round(data.rhythm.bpm)) : prev.bpm,
        key: data.tonal.key_edma
          ? `${data.tonal.key_edma.key} ${data.tonal.key_edma.scale}`
          : prev.key,
        danceability:
          typeof data.rhythm.danceability === "number"
            ? data.rhythm.danceability.toFixed(3)
            : prev.danceability,
        duration_seconds: Math.round(data.metadata.audio_properties.length),
      }));
    } catch (err) {
      alert("Upload failed: " + (err instanceof Error ? err.message : err));
    }
    setUploading(false);
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
    setFetching(true);
    try {
      const prompt = `Given the following track details, suggest genre, style, and detailed DJ-focused notes.\nTitle: ${form.title}\nArtist: ${form.artist}\nAlbum: ${form.album}`;
      const res = await fetch("/api/ai/track-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({
          ...prev,
          local_tags: data.genre || prev.local_tags,
          notes: data.notes || prev.notes,
        }));
      } else {
        alert("Failed to fetch from AI");
      }
    } catch {
      alert("Error fetching from AI");
    }
    setFetching(false);
  };

  const searchYouTube = async () => {
    setYoutubeLoading(true);
    setShowYoutubeModal(true);
    setYoutubeResults([]);
    try {
      const res = await fetch("/api/ai/youtube-music-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, artist: form.artist }),
      });
      if (res.ok) {
        const data = await res.json();
        setYoutubeResults(data.results || []);
      } else {
        alert("YouTube search failed");
      }
    } catch (err) {
      console.error("YouTube search error:", err);
      alert("YouTube search error");
    }
    setYoutubeLoading(false);
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
    setAnalyzing(true);
    try {
      const res = await fetch("/api/tracks/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apple_music_url: form.apple_music_url,
          youtube_url: form.youtube_url,
          soundcloud_url: cleanSoundcloudUrl(form.soundcloud_url),
          track_id: form.track_id,
          spotify_url: form.spotify_url,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Analysis result:", data);
        setForm((prev) => ({
          ...prev,
          bpm: data.rhythm.bpm ? String(Math.round(data.rhythm.bpm)) : prev.bpm,
          key: data.tonal.key_edma
            ? `${data.tonal.key_edma.key} ${data.tonal.key_edma.scale}`
            : prev.key,
          danceability:
            typeof data.rhythm.danceability === "number"
              ? data.rhythm.danceability.toFixed(3)
              : prev.danceability,
          duration_seconds: Math.round(data.metadata.audio_properties.length),
        }));
      } else {
        const err = await res.json();
        alert("Analysis failed: " + (err.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Audio analysis error:", err);
      alert("Error analyzing audio");
    }
    setAnalyzing(false);
  };

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
                <Stack gap={4}>
                  <SimpleGrid columns={[2, 3]} gap={2}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Button key={i} variant="outline" size="sm" disabled>
                        <Spinner size="xs" mr={2} /> Loading...
                      </Button>
                    ))}
                  </SimpleGrid>
                  <Stack borderWidth="1px" borderRadius="md" padding={4}>
                    <Stack gap={2}>
                      <Box>
                        <Skeleton height="28px" width="60%" mb={2} />
                        <Skeleton height="28px" width="70%" mb={2} />
                        <Skeleton height="28px" width="65%" />
                      </Box>
                      <Flex gap={2}>
                        <Skeleton height="38px" flex={1} />
                        <Skeleton height="38px" flex={1} />
                        <Skeleton height="38px" flex={1} />
                        <Skeleton height="38px" flex={1} />
                      </Flex>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} height="38px" />
                      ))}
                      <Skeleton height="24px" width="96px" />
                    </Stack>
                  </Stack>
                </Stack>
              ) : (
                <Box as="form" onSubmit={handleSubmit}>
                  <Flex gap={4} direction="row">
                    <Stack flex={1}>
                      <Box as={"nav"}>
                        <SimpleGrid columns={[2, 3]} gap={2}>
                          <Button
                            variant="outline"
                            size="sm"
                            loading={fetching}
                            disabled={fetching}
                            onClick={fetchFromChatGPT}
                          >
                            <SiChatbot /> Fetch from AI
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            loading={applePicker.loading}
                            disabled={applePicker.loading}
                            onClick={searchAppleMusic}
                          >
                            <SiApplemusic /> Search Apple Music
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            loading={youtubeLoading}
                            disabled={youtubeLoading}
                            onClick={searchYouTube}
                          >
                            <SiYoutube /> Search YouTube
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            loading={spotifyPicker.loading}
                            disabled={spotifyPicker.loading}
                            onClick={searchSpotify}
                          >
                            <SiSpotify /> Search Spotify
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            loading={analyzing}
                            disabled={
                              analyzing ||
                              (!form.apple_music_url &&
                                !form.youtube_url &&
                                !form.soundcloud_url &&
                                !form.spotify_url)
                            }
                            onClick={handleAnalyzeAudio}
                          >
                            <FiDownload /> Fetch Audio
                          </Button>
                          <FileUpload.Root
                            disabled={uploading}
                            onFileChange={(files) => {
                              // alert("File upload started");
                              // Chakra UI v3 FileUpload: files.acceptedFiles is the correct property
                              const file = files.acceptedFiles?.[0] || null;
                              setFile(file);
                              handleFileUpload();
                            }}
                          >
                            <FileUpload.HiddenInput />
                            <FileUpload.Trigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                width={"100%"}
                              >
                                {uploading ? (
                                  <>
                                    <Spinner /> Uploading...
                                  </>
                                ) : (
                                  <>
                                    <HiUpload /> Upload Audio
                                  </>
                                )}
                              </Button>
                            </FileUpload.Trigger>
                          </FileUpload.Root>
                        </SimpleGrid>
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

                  {/* --- YouTube Dialog --- */}
                  <Dialog.Root
                    open={showYoutubeModal}
                    onOpenChange={(details) =>
                      setShowYoutubeModal(details.open)
                    }
                    size={["full", "lg", "lg"]}
                  >
                    <Portal>
                      <Dialog.Backdrop />
                      <Dialog.Positioner>
                        <Dialog.Content>
                          <Dialog.Header>
                            <Dialog.Title>Select YouTube Video</Dialog.Title>
                            <Dialog.CloseTrigger asChild>
                              <CloseButton size="sm" />
                            </Dialog.CloseTrigger>
                          </Dialog.Header>
                          <Dialog.Body>
                            {youtubeLoading ? (
                              <Text>Loading...</Text>
                            ) : youtubeResults.length === 0 ? (
                              <Text>No results found.</Text>
                            ) : (
                              <Stack>
                                {youtubeResults.map((video) => (
                                  <Flex
                                    key={video.id}
                                    align="center"
                                    gap={3}
                                    borderWidth="1px"
                                    borderRadius="md"
                                    p={2}
                                    // _hover={{ bg: "gray.50", cursor: "pointer" }}
                                    onClick={() => {
                                      handleYoutubeSelect(video);
                                      console.log(video);
                                    }}
                                  >
                                    {video.thumbnail && (
                                      <Image
                                        src={video.thumbnail}
                                        alt={video.title}
                                        boxSize="60px"
                                        borderRadius="md"
                                      />
                                    )}
                                    <Box flex="1">
                                      <Text fontWeight="bold">
                                        {video.title}
                                      </Text>
                                      <Text fontSize="sm">{video.channel}</Text>
                                    </Box>
                                    <Button
                                      colorScheme="blue"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log(video);
                                        handleYoutubeSelect(video);
                                      }}
                                    >
                                      Select
                                    </Button>
                                  </Flex>
                                ))}
                              </Stack>
                            )}
                          </Dialog.Body>
                        </Dialog.Content>
                      </Dialog.Positioner>
                    </Portal>
                  </Dialog.Root>

                  {/* --- Spotify Dialog --- */}
                  <SpotifyPickerDialog
                    open={spotifyPicker.isOpen}
                    loading={spotifyPicker.loading}
                    results={spotifyPicker.results}
                    onOpenChange={(open) => (open ? spotifyPicker.open() : spotifyPicker.close())}
                    onSelect={(t) => spotifyPicker.select(t)}
                  />

                  {/* --- Apple Music Dialog --- */}
                  <AppleMusicPickerDialog
                    open={applePicker.isOpen}
                    loading={applePicker.loading}
                    results={applePicker.results}
                    onOpenChange={(open) => (open ? applePicker.open() : applePicker.close())}
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
