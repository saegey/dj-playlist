"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/types/track";
import { useUsername } from "@/providers/UsernameProvider";
import { fetchRecommendationCandidates } from "@/services/internalApi/recommendations";
import { fetchTracksByIds } from "@/services/internalApi/tracks";

export type TrackWithEmbedding = Track;

export type RecommendedTrack = Track & {
  _simIdentity: number | null;
  _simAudio: number | null;
};

async function fetchRecommendationsFromApi(
  seeds: Array<{ track_id: string; friend_id: number }>,
  limit: number
): Promise<RecommendedTrack[]> {
  const payload = await fetchRecommendationCandidates({
    tracks: seeds,
    limit_identity: limit,
    limit_audio: limit,
  });
  const candidates = payload.candidates ?? [];
  if (candidates.length === 0) return [];

  // Hydrate full track data (fixes album art and all missing fields)
  const refs = candidates.map((c) => ({ track_id: c.trackId, friend_id: c.friendId }));
  const hydrated = await fetchTracksByIds(refs);

  const hydratedMap = new Map(
    hydrated.map((t) => [`${t.track_id}:${t.friend_id}`, t])
  );

  return candidates
    .map((candidate): RecommendedTrack | null => {
      const full = hydratedMap.get(`${candidate.trackId}:${candidate.friendId}`);
      if (!full) return null;
      return {
        ...full,
        _simIdentity: candidate.simIdentity ?? null,
        _simAudio: candidate.simAudio ?? null,
      };
    })
    .filter((t): t is RecommendedTrack => t !== null);
}

export function useRecommendations() {
  const { friend: selectedFriend } = useUsername();

  const getRecommendations = useCallback(
    async (k: number = 25, playlist: TrackWithEmbedding[] = []): Promise<RecommendedTrack[]> => {
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
    queryFn: async (): Promise<RecommendedTrack[]> => {
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
