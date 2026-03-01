"use client";

import { useMutation } from "@tanstack/react-query";
import {
  uploadTrackAudio,
  type UploadTrackAudioArgs,
  type UploadTrackAudioResponse,
} from "@/services/internalApi/tracks";

export function useUploadTrackAudioMutation() {
  return useMutation<UploadTrackAudioResponse, Error, UploadTrackAudioArgs>({
    mutationFn: async (args: UploadTrackAudioArgs) => uploadTrackAudio(args),
  });
}
