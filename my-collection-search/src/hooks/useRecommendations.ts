import { useCallback } from "react";
import type { Track } from "@/types/track";
import { useMeili } from "@/providers/MeiliProvider";
import { useUsername } from "@/providers/UsernameProvider";

// Local structural type to accept tracks that may contain embeddings
export type TrackWithEmbedding = Track & {
  _vectors?: {
    default: number[];
  };
};

function computeAverageEmbedding(list: TrackWithEmbedding[]): number[] | null {
  const embeddings = list
    .map((t) => t._vectors?.default)
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
  const { username: selectedUsername } = useUsername();

  const getRecommendations = useCallback(
    async (k: number = 25, playlist: TrackWithEmbedding[] = []): Promise<Track[]> => {
      const playlistAvgEmbedding = computeAverageEmbedding(playlist);
      if (!playlistAvgEmbedding || playlistAvgEmbedding.length === 0) return [];
      if (!ready || !meiliClient) return [];

      try {
        const index = meiliClient.index("tracks");
        const playlistIds = playlist.map((t) => t.track_id);
        let filter = `NOT track_id IN [${playlistIds.join(",")}]`;
        if (selectedUsername) {
          const safeUser = selectedUsername.replace(/'/g, "''");
          filter += ` AND username = '${safeUser}'`;
        }
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
    [meiliClient, ready, selectedUsername]
  );

  return getRecommendations;
}

export default useRecommendations;
