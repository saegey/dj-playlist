"use client";

import { useState } from "react";
import type React from "react";
import { cleanSoundcloudUrl } from "@/lib/url";
import { toaster } from "@/components/ui/toaster";
import { useAsyncAnalyzeTrackMutation } from "@/hooks/useAsyncAnalyzeTrackMutation";
import { useUploadTrackAudioMutation } from "@/hooks/useUploadTrackAudioMutation";
import type {
  TrackEditFormProps,
  TrackEditFormState,
} from "@/components/track-edit/types";

type UseTrackEditAudioActionsArgs = {
  form: TrackEditFormState;
  setForm: React.Dispatch<React.SetStateAction<TrackEditFormState>>;
  onSave: (data: TrackEditFormProps) => void | Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
};

export function useTrackEditAudioActions({
  form,
  setForm,
  onSave,
  fileInputRef,
}: UseTrackEditAudioActionsArgs) {
  const [showRemoveAudioConfirm, setShowRemoveAudioConfirm] = useState(false);
  const [removeAudioLoading, setRemoveAudioLoading] = useState(false);

  const { mutateAsync: analyze, isPending: analyzeLoading } =
    useAsyncAnalyzeTrackMutation();
  const { mutateAsync: uploadAudio, isPending: uploadLoading } =
    useUploadTrackAudioMutation();

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

  const onFileSelected = (file: File | null) => {
    if (file) {
      void handleFileUpload(file);
    }
  };

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
        description:
          "Error queuing audio analysis: " +
          (err instanceof Error ? err.message : err),
        type: "error",
      });
    }
  };

  const handleRemoveAudioClick = () => {
    setShowRemoveAudioConfirm(true);
  };

  const closeRemoveAudioConfirm = () => {
    setShowRemoveAudioConfirm(false);
  };

  const handleRemoveAudioConfirm = async () => {
    setRemoveAudioLoading(true);
    try {
      if (!form.friend_id) {
        throw new Error("Track is missing friend_id");
      }

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

  return {
    analyzeLoading,
    uploadLoading,
    handleAnalyzeAudio,
    handleFileUpload,
    onFileSelected,
    showRemoveAudioConfirm,
    setShowRemoveAudioConfirm,
    closeRemoveAudioConfirm,
    handleRemoveAudioClick,
    handleRemoveAudioConfirm,
    removeAudioLoading,
  };
}
