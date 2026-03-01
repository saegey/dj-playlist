import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/types/track";
import { useUsername } from "@/providers/UsernameProvider";
import { fetchRecommendationCandidates } from "@/services/internalApi/recommendations";

export type TrackWithEmbedding = Track;

async function fetchRecommendationsFromApi(
  seeds: Array<{ track_id: string; friend_id: number }>,
  limit: number
): Promise<Track[]> {
  const payload = await fetchRecommendationCandidates({
    tracks: seeds,
    limit_identity: limit,
    limit_audio: limit,
  });
  const candidates = payload.candidates ?? [];
  return candidates.map((candidate) => {
    const metadata = candidate.metadata ?? {};
    return {
      id: 0,
      track_id: candidate.trackId,
      friend_id: candidate.friendId,
      title: metadata.title ?? candidate.trackId,
      artist: metadata.artist ?? "Unknown artist",
      album: metadata.album ?? "Unknown album",
      year: metadata.year ?? "",
      styles: Array.isArray(metadata.styles) ? metadata.styles : [],
      genres: Array.isArray(metadata.genres) ? metadata.genres : [],
      duration: "",
      position: 0,
      discogs_url: "",
      apple_music_url: "",
      bpm: metadata.bpm != null ? String(metadata.bpm) : undefined,
      key: metadata.key ?? undefined,
      local_tags: undefined,
      notes: undefined,
    } as Track;
  });
}

export function useRecommendations() {
  const { friend: selectedFriend } = useUsername();

  const getRecommendations = useCallback(
    async (k: number = 25, playlist: TrackWithEmbedding[] = []): Promise<Track[]> => {
      const seeds = playlist
        .map((track) => ({
          track_id: track.track_id,
          friend_id: selectedFriend?.id ?? track.friend_id,
        }))
        .filter(
          (track): track is { track_id: string; friend_id: number } =>
            typeof track.track_id === "string" && typeof track.friend_id === "number"
        );
      if (seeds.length === 0) return [];
      const dedupedSeeds = Array.from(
        new Map(seeds.map((seed) => [`${seed.track_id}:${seed.friend_id}`, seed])).values()
      );
      try {
        return await fetchRecommendationsFromApi(dedupedSeeds, k);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        return [];
      }
    },
    [selectedFriend]
  );

  return getRecommendations;
}

export function useRecommendationsQuery(
  playlist: TrackWithEmbedding[] = [],
  limit: number = 50
) {
  const { friend: selectedFriend } = useUsername();
  const seeds = playlist
    .map((track) => ({
      track_id: track.track_id,
      friend_id: selectedFriend?.id ?? track.friend_id,
    }))
    .filter(
      (track): track is { track_id: string; friend_id: number } =>
        typeof track.track_id === "string" && typeof track.friend_id === "number"
    );
  const dedupedSeeds = Array.from(
    new Map(seeds.map((seed) => [`${seed.track_id}:${seed.friend_id}`, seed])).values()
  );
  const seedKey = dedupedSeeds.map((seed) => `${seed.track_id}:${seed.friend_id}`).sort();

  return useQuery({
    queryKey: ["recommendations", { seeds: seedKey, limit }],
    queryFn: async (): Promise<Track[]> => {
      if (dedupedSeeds.length === 0) return [];
      try {
        return await fetchRecommendationsFromApi(dedupedSeeds, limit);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        return [];
      }
    },
    enabled: dedupedSeeds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export default useRecommendations;
