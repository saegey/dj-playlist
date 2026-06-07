"use client";

import React, { useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  RatingGroup,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FiArrowLeft } from "react-icons/fi";

import PageContainer from "@/components/layout/PageContainer";
import LabeledInput from "@/components/form/LabeledInput";
import LabeledTextarea from "@/components/form/LabeledTextarea";
import TrackEditFormDialogs from "@/components/track-edit/TrackEditFormDialogs";
import { createTrackEditActionsWrapper } from "@/components/TrackEditActionsWrapper";
import { useTrackEditSearchIntegrations } from "@/components/track-edit/useTrackEditSearchIntegrations";
import { useTrackEditAudioActions } from "@/components/track-edit/useTrackEditAudioActions";
import { toTrackEditFormState, type TrackEditFormProps } from "@/components/track-edit/types";
import { useTrackByIdQuery } from "@/hooks/useTrackByIdQuery";
import { useTracksQuery } from "@/hooks/useTracksQuery";
import { cleanSoundcloudUrl } from "@/lib/url";
import { toaster } from "@/components/ui/toaster";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box borderWidth="1px" borderRadius="md" p={4}>
      <Text fontWeight="semibold" fontSize="sm" color="gray.500" mb={3} textTransform="uppercase" letterSpacing="wide">
        {title}
      </Text>
      {children}
    </Box>
  );
}

export default function TrackEditPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const trackId = params?.id ?? "";
  const friendId = Number(searchParams?.get("friend_id") ?? "");
  const hasValidFriendId = Number.isFinite(friendId) && friendId > 0;

  const trackQuery = useTrackByIdQuery(trackId, friendId, hasValidFriendId);
  const track = trackQuery.data ?? null;
  const trackAsFormProps = track as unknown as TrackEditFormProps | null;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState(() => toTrackEditFormState(trackAsFormProps));
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (track) setForm(toTrackEditFormState(track as unknown as TrackEditFormProps));
  }, [track]);

  const { saveTrack } = useTracksQuery();

  const handleSave = async (data: TrackEditFormProps) => {
    await saveTrack(data);
    toaster.create({ title: "Track saved", type: "success" });
    router.back();
  };

  const {
    aiLoading, fetchFromChatGPT,
    applePicker, searchAppleMusic,
    youtubeLoading, searchYouTube, youtubeResults, showYoutubeModal, setShowYoutubeModal,
    handleYouTubeSearch, handleYoutubeSelect,
    discogsLoading, searchDiscogs, discogsVideos, showDiscogsModal, setShowDiscogsModal,
    handleDiscogsVideoSelect,
  } = useTrackEditSearchIntegrations({ track: trackAsFormProps, form, setForm });

  const {
    analyzeLoading, uploadLoading, handleAnalyzeAudio, onFileSelected,
    showRemoveAudioConfirm, setShowRemoveAudioConfirm, closeRemoveAudioConfirm,
    handleRemoveAudioClick, handleRemoveAudioConfirm, removeAudioLoading,
  } = useTrackEditAudioActions({ form, setForm, onSave: handleSave, fileInputRef });

  const TrackEditActionsWrapper = createTrackEditActionsWrapper({
    aiLoading,
    onFetchAI: fetchFromChatGPT,
    appleLoading: applePicker.loading,
    onSearchApple: searchAppleMusic,
    youtubeLoading,
    onSearchYouTube: searchYouTube,
    discogsLoading,
    onSearchDiscogs: searchDiscogs,
    analyzeLoading,
    onAnalyzeAudio: handleAnalyzeAudio,
    uploadLoading,
    onFileSelected,
    hasAudio: !!track?.local_audio_url,
    onRemoveAudio: handleRemoveAudioClick,
    removeAudioLoading,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.friend_id) {
      toaster.create({ title: "Track missing friend_id", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const cleanForm: TrackEditFormProps = {
        ...form,
        soundcloud_url: cleanSoundcloudUrl(form.soundcloud_url),
        bpm: Number(form.bpm) || null,
        key: form.key || null,
        danceability: Number(form.danceability) || null,
        duration_seconds: Number(form.duration_seconds) || null,
        friend_id: form.friend_id,
      };
      await handleSave(cleanForm);
    } finally {
      setSaving(false);
    }
  };

  const detailHref = `/tracks/${encodeURIComponent(trackId)}?friend_id=${friendId}`;

  return (
    <PageContainer size="standard">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} gap={3} wrap="wrap">
        <Flex align="center" gap={3}>
          <Button asChild variant="ghost" size="sm">
            <NextLink href={detailHref}>
              <FiArrowLeft /> Back
            </NextLink>
          </Button>
          <Heading size="md">Edit Track</Heading>
        </Flex>
        {track && (
          <TrackEditActionsWrapper
            analyzeDisabled={
              analyzeLoading ||
              (!form.apple_music_url && !form.youtube_url && !form.soundcloud_url)
            }
          />
        )}
      </Flex>

      {!hasValidFriendId && (
        <Box borderWidth="1px" borderRadius="md" p={4}>
          <Text>Missing <code>friend_id</code> query param.</Text>
        </Box>
      )}

      {hasValidFriendId && trackQuery.isLoading && (
        <Stack gap={4}>
          <Skeleton height="120px" borderRadius="md" />
          <Skeleton height="100px" borderRadius="md" />
          <Skeleton height="120px" borderRadius="md" />
          <Skeleton height="120px" borderRadius="md" />
        </Stack>
      )}

      {hasValidFriendId && !trackQuery.isLoading && !track && (
        <Text>Track not found.</Text>
      )}

      {hasValidFriendId && track && (
        <Box as="form" onSubmit={handleSubmit}>
          <Stack gap={4}>
            {/* Core Info */}
            <SectionCard title="Core Info">
              <Stack gap={3}>
                <LabeledInput
                  label="Title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                />
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
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
                </Grid>
                <Box>
                  <Text mb={1} fontSize="sm">Rating</Text>
                  <RatingGroup.Root
                    value={form.star_rating}
                    onValueChange={({ value }) => setForm((prev) => ({ ...prev, star_rating: value }))}
                    size="md"
                    count={5}
                  >
                    <RatingGroup.HiddenInput />
                    <RatingGroup.Control />
                  </RatingGroup.Root>
                </Box>
              </Stack>
            </SectionCard>

            {/* Audio Metadata */}
            <SectionCard title="Audio Metadata">
              <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={3}>
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
                  label="Duration (s)"
                  name="duration_seconds"
                  value={form.duration_seconds ?? ""}
                  onChange={handleChange}
                  type="number"
                />
              </Grid>
            </SectionCard>

            {/* Notes & Tags */}
            <SectionCard title="Notes & Tags">
              <Stack gap={3}>
                <LabeledTextarea
                  label="Notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={5}
                />
                <LabeledInput
                  label="Genre tags (comma separated)"
                  name="local_tags"
                  value={form.local_tags}
                  onChange={handleChange}
                />
              </Stack>
            </SectionCard>

            {/* Links */}
            <SectionCard title="Links">
              <Stack gap={3}>
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
              </Stack>
            </SectionCard>
          </Stack>

          <Flex gap={3} mt={6}>
            <Button type="submit" loading={saving} disabled={saving}>
              Save
            </Button>
            <Button variant="outline" onClick={() => router.back()} disabled={saving}>
              Cancel
            </Button>
          </Flex>
        </Box>
      )}

      {/* Sub-dialogs (Apple picker, YouTube, Discogs, remove audio confirm) */}
      {track && (
        <TrackEditFormDialogs
          track={trackAsFormProps!}
          title={form.title}
          artist={form.artist}
          album={form.album}
          youtubeOpen={showYoutubeModal}
          youtubeLoading={youtubeLoading}
          youtubeResults={youtubeResults}
          onYouTubeOpenChange={setShowYoutubeModal}
          onYouTubeSelect={handleYoutubeSelect}
          onYouTubeSearch={handleYouTubeSearch}
          appleOpen={applePicker.isOpen}
          onAppleOpenChange={(open) => open ? applePicker.open() : applePicker.close()}
          onAppleSelect={(song) => applePicker.select(song)}
          discogsOpen={showDiscogsModal}
          onDiscogsClose={() => setShowDiscogsModal(false)}
          discogsVideos={discogsVideos}
          discogsLoading={discogsLoading}
          onDiscogsVideoSelect={handleDiscogsVideoSelect}
          removeAudioOpen={showRemoveAudioConfirm}
          onRemoveAudioOpenChange={setShowRemoveAudioConfirm}
          onRemoveAudioCancel={closeRemoveAudioConfirm}
          onRemoveAudioConfirm={handleRemoveAudioConfirm}
          removeAudioLoading={removeAudioLoading}
        />
      )}
    </PageContainer>
  );
}
