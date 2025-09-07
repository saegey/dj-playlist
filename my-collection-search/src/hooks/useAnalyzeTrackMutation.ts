"use client";

import { useMutation } from "@tanstack/react-query";
import {
  analyzeTrack,
  type AnalyzeArgs,
  type AnalyzeResponse,
} from "@/services/trackService";

export function useAnalyzeTrackMutation() {
  return useMutation<AnalyzeResponse, Error, AnalyzeArgs>({
    mutationFn: async (args: AnalyzeArgs) => analyzeTrack(args),
  });
}
