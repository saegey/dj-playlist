import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/types/track";
import { useMeili } from "@/providers/MeiliProvider";
import { useUsername } from "@/providers/UsernameProvider";

// Local structural type to accept tracks that may contain embeddings
export type TrackWithEmbedding = Track & {
  _vectors?: {
    default?: number[];
  };
};

function parseEmbeddingValue(value: unknown): number[] | null {
  if (Array.isArray(value) && value.length > 0) {
    return value.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  }
  if (typeof value === "string" && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .map((n) => Number(n))
          .filter((n) => Number.isFinite(n));
      }
    } catch {
      // ignore parse failures
    }
  }
  return null;
}

function extractEmbedding(track: TrackWithEmbedding): number[] | null {
  return (
    parseEmbeddingValue(track._vectors?.default) ??
    parseEmbeddingValue((track as Track & { embedding?: unknown }).embedding)
  );
}

function quoteMeiliString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function buildRecommendationFilter(trackIds: string[], friendId?: number): string | undefined {
  const clauses: string[] = [];
  const uniqueIds = Array.from(new Set(trackIds.filter(Boolean)));
  if (uniqueIds.length > 0) {
    clauses.push(`NOT track_id IN [${uniqueIds.map(quoteMeiliString).join(", ")}]`);
  }
  if (typeof friendId === "number") {
    clauses.push(`friend_id = ${friendId}`);
  }
  return clauses.length > 0 ? clauses.join(" AND ") : undefined;
}

function computeAverageEmbedding(list: TrackWithEmbedding[]): number[] | null {
  const embeddings = list
    .map((t) => extractEmbedding(t))
    .filter((emb): emb is number[] => Array.isArray(emb) && emb.length > 0);
  if (embeddings.length === 0) return null;
  const dim = embeddings[0].length;
  const avg = new Array(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) avg[i] += emb[i];
  }
  for (let i = 0; i < dim; i++) avg[i] /= embeddings.length;
  return avg;
}

/**
 * Hook that returns a recommendation function backed by Meilisearch vector search.
 * The returned function takes (k, playlist) and returns top-k similar tracks not in the playlist,
 * optionally scoped to the current selected username.
 */
export function useRecommendations() {
  const { client: meiliClient, ready } = useMeili();
  const { friend: selectedFriend } = useUsername();

  const getRecommendations = useCallback(
    async (
      k: number = 25,
      playlist: TrackWithEmbedding[] = []
    ): Promise<Track[]> => {
      const playlistAvgEmbedding = computeAverageEmbedding(playlist);
      if (!playlistAvgEmbedding || playlistAvgEmbedding.length === 0) return [];
      if (!ready || !meiliClient) return [];

      try {
        const index = meiliClient.index("tracks");
        const playlistIds = playlist.map((t) => t.track_id);
        const scopeFriendId = selectedFriend?.id ?? playlist[0]?.friend_id;
        const filter = buildRecommendationFilter(playlistIds, scopeFriendId);
        const results = await index.search(undefined, {
          vector: playlistAvgEmbedding,
          limit: k,
          filter,
        });
        return (results.hits as Track[]) || [];
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        return [];
      }
    },
    [meiliClient, ready, selectedFriend]
  );

  return getRecommendations;
}

/**
 * React Query version of recommendations hook.
 * Returns a query object with data, isLoading, etc.
 */
export function useRecommendationsQuery(
  playlist: TrackWithEmbedding[] = [],
  limit: number = 50
) {
  const { client: meiliClient, ready } = useMeili();
  const { friend: selectedFriend } = useUsername();

  // Generate a stable key based on playlist track IDs
  const playlistIds = playlist.map((t) => t.track_id).sort();
  const friendId = selectedFriend?.id ?? playlist[0]?.friend_id;

  return useQuery({
    queryKey: ["recommendations", { playlistIds, limit, friendId }],
    queryFn: async (): Promise<Track[]> => {
      const playlistAvgEmbedding = computeAverageEmbedding(playlist);
      if (!playlistAvgEmbedding || playlistAvgEmbedding.length === 0) return [];
      if (!ready || !meiliClient) return [];

      try {
        const index = meiliClient.index("tracks");
        const filter = buildRecommendationFilter(playlistIds, friendId);
        const results = await index.search(undefined, {
          vector: playlistAvgEmbedding,
          limit,
          filter,
        });
        return (results.hits as Track[]) || [];
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        return [];
      }
    },
    enabled: playlist.length > 0 && ready,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export default useRecommendations;
