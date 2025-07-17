"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Input,
  Textarea,
  Text,
  Stack,
  Image,
  Flex,
  Portal,
  Dialog,
  CloseButton,
  RatingGroup,
} from "@chakra-ui/react";

import { AppleMusicResult, YoutubeVideo } from "@/types/track";

export interface TrackEditFormProps {
  track_id: string; // Optional for new tracks
  title?: string;
  artist?: string;
  album?: string;
  local_tags?: string | undefined;
  notes?: string | undefined | null;
  bpm?: string | undefined | null;
  key?: string | undefined | null;
  danceability?: string | null;
  apple_music_url?: string;
  youtube_url?: string;
  soundcloud_url?: string;
  star_rating?: number;
}

// Labeled input for text/number fields
function LabeledInput({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <Box flex="1">
      <Text mb={1} fontSize="sm">
        {label}
      </Text>
      <Input {...props} />
    </Box>
  );
}

// Labeled textarea for notes
function LabeledTextarea({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof Textarea>) {
  return (
    <Box>
      <Text mb={1} fontSize="sm">
        {label}
      </Text>
      <Textarea {...props} />
    </Box>
  );
}

export default function TrackEditForm({
  track,
  onSave,
}: {
  track: TrackEditFormProps;
  onSave: (data: TrackEditFormProps) => void;
}) {
  const [form, setForm] = useState({
    track_id: track.track_id || "",
    album: track.album || "",
    title: track.title || "",
    artist: track.artist || "",
    local_tags: track.local_tags || "",
    notes: track.notes || "",
    bpm: track.bpm || "",
    key: track.key || "",
    danceability: track.danceability || "",
    apple_music_url: track.apple_music_url || "",
    youtube_url: track.youtube_url || "",
    soundcloud_url: track.soundcloud_url || "",
    star_rating: typeof track.star_rating === "number" ? track.star_rating : 0,
  });

  const [youtubeResults, setYoutubeResults] = useState<YoutubeVideo[]>([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);

  const [appleResults, setAppleResults] = useState<AppleMusicResult[]>([]);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showAppleModal, setShowAppleModal] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);

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
    onSave(form);
    setLoading(false);
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

  const handleYoutubeSelect = (video: YoutubeVideo) => {
    setForm((prev) => ({ ...prev, youtube_url: video.url }));
    setShowYoutubeModal(false);
  };

  const searchAppleMusic = async () => {
    setAppleLoading(true);
    setShowAppleModal(true);
    setAppleResults([]);
    try {
      const res = await fetch("/api/ai/apple-music-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, artist: form.artist }),
      });
      if (res.ok) {
        const data = await res.json();
        setAppleResults(data.results || []);
      } else {
        alert("Apple Music search failed");
      }
    } catch (err) {
      console.error("Apple Music search error:", err);
      alert("Apple Music search error");
    }
    setAppleLoading(false);
  };

  const handleAppleSelect = (song: AppleMusicResult) => {
    setForm((prev) => ({
      ...prev,
      apple_music_url: song.url,
      duration_seconds: song.duration
        ? Math.round(song.duration / 1000)
        : undefined,
    }));
    setShowAppleModal(false);
  };

  const handleAnalyzeAudio = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/tracks/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apple_music_url: form.apple_music_url,
          youtube_url: form.youtube_url,
          soundcloud_url: form.soundcloud_url,
          track_id: form.track_id,
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
          danceability: data.rhythm.danceability || prev.danceability,
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
    <Box
      as="form"
      onSubmit={handleSubmit}
      // p={4}
      // borderWidth="1px"
      // borderRadius="md"
    >
      <Flex gap={2} mb={2}>
        <Button
          type="button"
          colorScheme="purple"
          loading={fetching}
          size="sm"
          onClick={fetchFromChatGPT}
        >
          Fetch from AI
        </Button>
        <Button
          type="button"
          colorScheme="red"
          loading={appleLoading}
          onClick={searchAppleMusic}
          size="sm"
        >
          Search Apple Music
        </Button>
        <Button
          type="button"
          colorScheme="gray"
          loading={youtubeLoading}
          onClick={searchYouTube}
          size="sm"
        >
          Search YouTube
        </Button>
        <Button
          type="button"
          colorScheme="teal"
          loading={analyzing}
          onClick={handleAnalyzeAudio}
          size="sm"
          disabled={
            !form.apple_music_url && !form.youtube_url && !form.soundcloud_url
          }
        >
          Analyze Audio
        </Button>
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
      <Button type="submit" colorScheme="blue" loading={loading}>
        Save
      </Button>

      {/* --- YouTube Dialog --- */}
      <Dialog.Root
        open={showYoutubeModal}
        onOpenChange={(details) => setShowYoutubeModal(details.open)}
        size="lg"
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
                        _hover={{ bg: "gray.50", cursor: "pointer" }}
                        onClick={() => handleYoutubeSelect(video)}
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
                          <Text fontWeight="bold">{video.title}</Text>
                          <Text fontSize="sm">{video.channel}</Text>
                        </Box>
                        <Button
                          colorScheme="blue"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
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

      {/* --- Apple Music Dialog --- */}
      <Dialog.Root
        open={showAppleModal}
        onOpenChange={(details) => setShowAppleModal(details.open)}
        size="lg"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Select Apple Music Track</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                {appleLoading ? (
                  <Text>Loading...</Text>
                ) : appleResults.length === 0 ? (
                  <Text>No results found.</Text>
                ) : (
                  <Stack>
                    {appleResults.map((song) => (
                      <Flex
                        key={song.id}
                        align="center"
                        gap={3}
                        borderWidth="1px"
                        borderRadius="md"
                        p={2}
                        _hover={{ bg: "gray.50", cursor: "pointer" }}
                        onClick={() => handleAppleSelect(song)}
                      >
                        {song.artwork && (
                          <Image
                            src={song.artwork.replace("{w}x{h}bb", "60x60bb")}
                            alt={song.title}
                            boxSize="60px"
                            borderRadius="md"
                          />
                        )}
                        <Box flex="1">
                          <Text fontWeight="bold">{song.title}</Text>
                          <Text fontSize="sm">
                            {song.artist} — {song.album}
                          </Text>
                        </Box>
                        <Button
                          colorScheme="blue"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppleSelect(song);
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
    </Box>
  );
}
