"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  Flex,
  Portal,
  Dialog,
  CloseButton,
} from "@chakra-ui/react";
import { cleanSoundcloudUrl } from "@/lib/url";
import TrackEditFormSkeleton from "@/components/TrackEditFormSkeleton";
import { createTrackEditActionsWrapper } from "@/components/TrackEditActionsWrapper";
import { useTrackEditSearchIntegrations } from "@/components/track-edit/useTrackEditSearchIntegrations";
import { useTrackEditAudioActions } from "@/components/track-edit/useTrackEditAudioActions";
import TrackEditFormFields from "@/components/track-edit/TrackEditFormFields";
import TrackEditFormDialogs from "@/components/track-edit/TrackEditFormDialogs";
import {
  toTrackEditFormState,
  type TrackEditFormProps,
} from "@/components/track-edit/types";

export type { TrackEditFormProps } from "@/components/track-edit/types";

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

  const [form, setForm] = useState(() => toTrackEditFormState(track));

  React.useEffect(() => {
    setForm(toTrackEditFormState(track));
  }, [track]);

  const [loading, setLoading] = useState(false);
  const {
    aiLoading,
    fetchFromChatGPT,
    applePicker,
    searchAppleMusic,
    youtubeLoading,
    searchYouTube,
    youtubeResults,
    showYoutubeModal,
    setShowYoutubeModal,
    handleYouTubeSearch,
    handleYoutubeSelect,
    discogsLoading,
    searchDiscogs,
    discogsVideos,
    showDiscogsModal,
    setShowDiscogsModal,
    handleDiscogsVideoSelect,
  } = useTrackEditSearchIntegrations({ track, form, setForm });
  const {
    analyzeLoading,
    uploadLoading,
    handleAnalyzeAudio,
    onFileSelected,
    showRemoveAudioConfirm,
    setShowRemoveAudioConfirm,
    closeRemoveAudioConfirm,
    handleRemoveAudioClick,
    handleRemoveAudioConfirm,
    removeAudioLoading,
  } = useTrackEditAudioActions({ form, setForm, onSave, fileInputRef });

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

  const TrackEditActionsWrapper = createTrackEditActionsWrapper({
    aiLoading: aiLoading,
    onFetchAI: fetchFromChatGPT,
    appleLoading: applePicker.loading,
    onSearchApple: searchAppleMusic,
    youtubeLoading: youtubeLoading,
    onSearchYouTube: searchYouTube,
    discogsLoading: discogsLoading,
    onSearchDiscogs: searchDiscogs,
    analyzeLoading: analyzeLoading,
    onAnalyzeAudio: handleAnalyzeAudio,
    uploadLoading: uploadLoading,
    onFileSelected,
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
            <Dialog.Header p={[4, 6, 6]}>
              <Flex justify="space-between" align="center" width="100%">
                <Flex align="center" gap={3}>
                  <Dialog.Title>Edit Track</Dialog.Title>
                  {track && (
                    <TrackEditActionsWrapper
                      analyzeDisabled={
                        analyzeLoading ||
                        (!form.apple_music_url &&
                          !form.youtube_url &&
                          !form.soundcloud_url)
                      }
                    />
                  )}
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton ref={initialFocusRef} size="sm" />
                </Dialog.CloseTrigger>
              </Flex>
            </Dialog.Header>
            <Dialog.Body px={{ base: 2, md: 6 }} py={{ base: 2, md: 6 }}>
              {!track ? (
                <TrackEditFormSkeleton />
              ) : (
                <Box as="form" onSubmit={handleSubmit}>
                  <TrackEditFormFields
                    values={form}
                    loading={loading}
                    onChange={handleChange}
                    onStarRatingChange={handleStarRating}
                  />

                  <TrackEditFormDialogs
                    track={track}
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
                    onAppleOpenChange={(open) =>
                      open ? applePicker.open() : applePicker.close()
                    }
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
                </Box>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
