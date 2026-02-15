import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/types/track";

interface SimilarTracksResponse {
  source_track_id: string;
  source_friend_id: number;
  filters: {
    era?: string;
    country?: string;
    tags?: string[];
  };
  count: number;
  tracks: Array<
    Track & {
      distance: number;
      identity_text: string;
    }
  >;
}

interface SimilarTracksOptions {
  track_id: string;
  friend_id: number;
  limit?: number;
  era?: string;
  country?: string;
  tags?: string[];
  enabled?: boolean;
}

/**
 * Fetch similar tracks based on identity embeddings
 */
async function fetchSimilarTracks(
  options: SimilarTracksOptions
): Promise<SimilarTracksResponse> {
  const params = new URLSearchParams({
    track_id: options.track_id,
    friend_id: options.friend_id.toString(),
  });

  if (options.limit) params.append("limit", options.limit.toString());
  if (options.era) params.append("era", options.era);
  if (options.country) params.append("country", options.country);
  if (options.tags && options.tags.length > 0) {
    params.append("tags", options.tags.join(","));
  }

  const response = await fetch(`/api/embeddings/similar?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Hook to fetch similar tracks based on identity embeddings
 */
export function useSimilarTracks(options: SimilarTracksOptions) {
  return useQuery({
    queryKey: [
      "similar-tracks",
      options.track_id,
      options.friend_id,
      options.limit,
      options.era,
      options.country,
      options.tags,
    ],
    queryFn: () => fetchSimilarTracks(options),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export default useSimilarTracks;
