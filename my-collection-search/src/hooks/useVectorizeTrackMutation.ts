"use client";

import { useMutation } from "@tanstack/react-query";
import { vectorizeTrack } from "@/services/internalApi/tracks";

type VectorizeArgs = {
  track_id: string;
  friend_id: number;
};

export function useVectorizeTrackMutation() {
  return useMutation<{ embedding: number[] }, Error, VectorizeArgs>({
    mutationFn: async (args: VectorizeArgs) => {
      return await vectorizeTrack(args);
    },
  });
}
