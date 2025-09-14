"use client";

import { useMutation } from "@tanstack/react-query";
import {
  fetchYouTubeMusicSearch,
  type YouTubeMusicSearchArgs,
  type YouTubeMusicSearchResponse,
} from "@/services/aiService";

export function useYouTubeMusicSearchMutation() {
  return useMutation<YouTubeMusicSearchResponse, Error, YouTubeMusicSearchArgs>({
    mutationFn: async (args: YouTubeMusicSearchArgs) => fetchYouTubeMusicSearch(args),
  });
}
