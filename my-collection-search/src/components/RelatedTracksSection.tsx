"use client";

import { useMemo, useState } from "react";
import { Badge, Box, Button, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/types/track";
import TrackResult from "@/components/TrackResult";
import TrackActionsMenu from "@/components/TrackActionsMenu";
import { useRecommendationsQuery } from "@/hooks/useRecommendations";
import { useSimilarTracks } from "@/hooks/useSimilarTracks";
import { useSimilarVibeTracks } from "@/hooks/useSimilarVibeTracks";
import { fetchTracksByIds, type TrackBatchRef } from "@/services/internalApi/tracks";

type Props = {
  track: Track;
};

type SourceType = "ai" | "similar" | "vibe";

type MergedTrack = Track & {
  _sources: SourceType[];
  _score: number;
};

function keyOf(track: Pick<Track, "track_id" | "friend_id">): string {
  return `${track.track_id}:${track.friend_id}`;
}

function normalizeArtwork(track: Track): Track {
  return {
    ...track,
    album_thumbnail:
      track.album_thumbnail ||
      track.audio_file_album_art_url ||
      "/images/placeholder-artwork.png",
  };
}

export default function RelatedTracksSection({ track }: Props) {
  const [showAll, setShowAll] = useState(false);

  const recQuery = useRecommendationsQuery([track], 60);
  const similarQuery = useSimilarTracks({
    track_id: track.track_id,
    friend_id: track.friend_id,
    limit: 60,
  });
  const vibeQuery = useSimilarVibeTracks({
    track_id: track.track_id,
    friend_id: track.friend_id,
    limit: 60,
  });

  const merged = useMemo<MergedTrack[]>(() => {
    const baseKey = keyOf(track);
    const map = new Map<string, MergedTrack>();

    const add = (item: Track, source: SourceType, score: number) => {
      const k = keyOf(item);
      if (k === baseKey) return;
      const existing = map.get(k);
      if (!existing) {
        map.set(k, {
          ...normalizeArtwork(item),
          _sources: [source],
          _score: score,
        });
        return;
      }
      if (!existing._sources.includes(source)) {
        existing._sources.push(source);
      }
      existing._score += score;
    };

    const recs = recQuery.data ?? [];
    recs.forEach((item, idx) => {
      const rankScore = 1 - idx / Math.max(recs.length, 1);
      add(item, "ai", 0.8 * rankScore);
    });

    const similar = similarQuery.data?.tracks ?? [];
    similar.forEach((item: Track & { distance?: number }, idx: number) => {
      const distanceScore = Math.max(0, 1 - (item.distance ?? 1));
      const rankScore = 1 - idx / Math.max(similar.length, 1);
      add(item, "similar", distanceScore * 0.75 + rankScore * 0.25);
    });

    const vibes = vibeQuery.data?.tracks ?? [];
    vibes.forEach((item: Track & { distance?: number }, idx: number) => {
      const distanceScore = Math.max(0, 1 - (item.distance ?? 1));
      const rankScore = 1 - idx / Math.max(vibes.length, 1);
      add(item, "vibe", distanceScore * 0.75 + rankScore * 0.25);
    });

    return [...map.values()].sort((a, b) => b._score - a._score);
  }, [track, recQuery.data, similarQuery.data, vibeQuery.data]);

  const hydrateRefs = useMemo<TrackBatchRef[]>(
    () =>
      merged.map((t) => ({
        track_id: t.track_id,
        friend_id: t.friend_id,
      })),
    [merged]
  );

  const hydratedQuery = useQuery({
    queryKey: ["related-tracks-hydrated", hydrateRefs],
    queryFn: async () => {
      if (hydrateRefs.length === 0) return [] as Track[];
      return await fetchTracksByIds(hydrateRefs);
    },
    enabled: hydrateRefs.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const hydratedByKey = useMemo(() => {
    const map = new Map<string, Track>();
    for (const t of hydratedQuery.data ?? []) {
      map.set(keyOf(t), t);
    }
    return map;
  }, [hydratedQuery.data]);

  const resolved = useMemo<MergedTrack[]>(
    () =>
      merged.map((item) => {
        const hydrated = hydratedByKey.get(keyOf(item));
        if (!hydrated) return item;
        return {
          ...item,
          ...normalizeArtwork(hydrated),
          _sources: item._sources,
          _score: item._score,
        };
      }),
    [merged, hydratedByKey]
  );

  const displayTracks = showAll ? resolved.slice(0, 60) : resolved.slice(0, 20);
  const isLoading = recQuery.isLoading || similarQuery.isLoading || vibeQuery.isLoading;
  const hasError = recQuery.error || similarQuery.error || vibeQuery.error;

  return (
    <Box borderWidth="1px" borderRadius="md" p={4} mt={4}>
      <Flex justify="space-between" align="center" mb={3} gap={3} wrap="wrap">
        <Heading size="sm">Related Tracks</Heading>
        <Text fontSize="sm" color="fg.muted">
          Combined from AI recommendations, similar tracks, and similar vibes
        </Text>
      </Flex>

      {isLoading ? (
        <Flex align="center" gap={3} py={4}>
          <Spinner size="sm" />
          <Text>Loading related tracks...</Text>
        </Flex>
      ) : hasError ? (
        <Text color="red.500">
          Could not load related tracks from all sources.
        </Text>
      ) : displayTracks.length === 0 ? (
        <Text color="fg.muted">No related tracks found.</Text>
      ) : (
        <>
          <Text fontSize="sm" color="fg.muted" mb={3}>
            Showing {displayTracks.length} of {merged.length}
          </Text>

          {displayTracks.map((item, idx) => (
            <Box key={`${item.track_id}-${item.friend_id}`} mb={2}>
              <TrackResult
                track={item}
                showUsername={true}
                showRating={true}
                minimized={false}
                allowMinimize={false}
                buttons={
                  <Flex gap={2} align="center" wrap="wrap">
                    {item._sources.includes("ai") && (
                      <Badge colorPalette="purple" size="sm">AI</Badge>
                    )}
                    {item._sources.includes("similar") && (
                      <Badge colorPalette="blue" size="sm">Similar</Badge>
                    )}
                    {item._sources.includes("vibe") && (
                      <Badge colorPalette="cyan" size="sm">Vibe</Badge>
                    )}
                    <TrackActionsMenu track={item} />
                  </Flex>
                }
              />
            </Box>
          ))}

          {merged.length > 20 && (
            <Button
              size="sm"
              variant="outline"
              mt={2}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Show Top 20" : "Show More"}
            </Button>
          )}
        </>
      )}
    </Box>
  );
}
