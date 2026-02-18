import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/types/track";

interface SimilarVibeTracksResponse {
  source_track_id: string;
  source_friend_id: number;
  count: number;
  tracks: Array<
    Track & {
      distance: number;
      identity_text: string;
    }
  >;
}

interface SimilarVibeTracksOptions {
  track_id: string;
  friend_id: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * Fetch similar tracks based on audio vibe embeddings
 */
async function fetchSimilarVibeTracks(
  options: SimilarVibeTracksOptions
): Promise<SimilarVibeTracksResponse> {
  const params = new URLSearchParams({
    track_id: options.track_id,
    friend_id: options.friend_id.toString(),
  });

  if (options.limit) params.append("limit", options.limit.toString());

  const response = await fetch(`/api/embeddings/similar-vibe?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Hook to fetch similar tracks based on audio vibe embeddings
 */
export function useSimilarVibeTracks(options: SimilarVibeTracksOptions) {
  return useQuery({
    queryKey: [
      "similar-vibe-tracks",
      options.track_id,
      options.friend_id,
      options.limit,
    ],
    queryFn: () => fetchSimilarVibeTracks(options),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export default useSimilarVibeTracks;
