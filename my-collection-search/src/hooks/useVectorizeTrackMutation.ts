"use client";

import { useMutation } from "@tanstack/react-query";
import { vectorizeTrack } from "@/services/trackService";

type VectorizeArgs = {
  track_id: string;
  friend_id: number;
};

export function useVectorizeTrackMutation() {
  return useMutation<void, Error, VectorizeArgs>({
    mutationFn: async (args: VectorizeArgs) => {
      await vectorizeTrack(args);
    },
  });
}
