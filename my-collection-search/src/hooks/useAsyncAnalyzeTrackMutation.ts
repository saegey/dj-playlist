"use client";

import { useMutation } from "@tanstack/react-query";
import {
  analyzeTrackAsync,
  type AnalyzeArgs,
  type AsyncAnalyzeResponse,
} from "@/services/trackService";

export function useAsyncAnalyzeTrackMutation() {
  return useMutation<AsyncAnalyzeResponse, Error, AnalyzeArgs>({
    mutationFn: async (args: AnalyzeArgs) => analyzeTrackAsync(args),
  });
}