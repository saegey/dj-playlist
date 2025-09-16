"use client";

import { useMutation } from "@tanstack/react-query";
import {
  analyzeTrackAsync,
  type AsyncAnalyzeArgs,
  type AsyncAnalyzeResponse,
} from "@/services/asyncTrackService";

export function useAsyncAnalyzeTrackMutation() {
  return useMutation<AsyncAnalyzeResponse, Error, AsyncAnalyzeArgs>({
    mutationFn: async (args: AsyncAnalyzeArgs) => analyzeTrackAsync(args),
  });
}