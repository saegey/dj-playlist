"use client";

import { useMutation } from "@tanstack/react-query";
import {
  fetchTrackMetadata,
  type TrackMetadataArgs,
  type TrackMetadataResponse,
} from "@/services/trackService";

export function useTrackMetadataMutation() {
  return useMutation<TrackMetadataResponse, Error, TrackMetadataArgs>({
    mutationFn: async (args: TrackMetadataArgs) => fetchTrackMetadata(args),
  });
}
