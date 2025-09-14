import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { generateGeneticPlaylist } from "@/services/playlistService";
import type { Track } from "@/types/track";
import { useTrackStore } from "@/stores/trackStore";
import {
  buildCompatibilityGraph,
  greedyPath,
  keyToCamelot,
  TrackCompat,
} from "@/lib/playlistOrder";

/**
 * Hook for playlist mutation operations (sort, clear, reorder)
 * Works with query-based playlist data
 */
export function usePlaylistMutations(playlistId?: number) {
  const queryClient = useQueryClient();
  const { getTrack } = useTrackStore();

  // Get current track refs (track_id + friend_id) from cache
  type TrackRef = { track_id: string; friend_id: number };
  const getTrackIds = (): TrackRef[] => {
    if (!playlistId) return [];
    return (
      queryClient.getQueryData(queryKeys.playlistTrackIds(playlistId)) || []
    );
  };

  // Update track IDs in cache
  const updateTrackIds = (newTrackIds: string[]) => {
    if (!playlistId) return;
    queryClient.setQueryData(
      queryKeys.playlistTrackIds(playlistId),
      newTrackIds
    );
  };

  // Move track from one position to another
  const moveTrack = (fromIdx: number, toIdx: number) => {
    const trackRefs = getTrackIds();
    if (
      fromIdx < 0 ||
      fromIdx >= trackRefs.length ||
      toIdx < 0 ||
      toIdx >= trackRefs.length
    ) {
      return;
    }

    const newRefs = [...trackRefs];
    const [moved] = newRefs.splice(fromIdx, 1);
    newRefs.splice(toIdx, 0, moved);

    updateTrackIds(newRefs.map((r) => r.track_id));
  };

  // Remove track from playlist
  const removeFromPlaylist = (trackIdToRemove: string) => {
    const trackRefs = getTrackIds();
    const newRefs = trackRefs.filter((r) => r.track_id !== trackIdToRemove);
    updateTrackIds(newRefs.map((r) => r.track_id));
  };

  const addToPlaylist = (track: Track) => {
    const trackRefs = getTrackIds();
    if (!trackRefs.some((r) => r.track_id === track.track_id)) {
      const newTrackIds = [...trackRefs.map((r) => r.track_id), track.track_id];
      updateTrackIds(newTrackIds);
    }
  };

  // Clear entire playlist
  const clearPlaylist = () => {
    updateTrackIds([]);
  };

  // Sort playlist using greedy algorithm
  const sortGreedy = () => {
    const trackRefs = getTrackIds();
    console.log("Greedy sort track refs:", trackRefs);
    if (trackRefs.length === 0) return;

    const tracks = trackRefs
      .map((ref) => {
        let track = getTrack(ref.track_id, ref.friend_id); // Try without specific friend_id first
        if (!track) {
          track = useTrackStore
            .getState()
            .getTrack(ref.track_id, ref.friend_id);
        }
        return track;
      })
      .filter(Boolean) as Track[];

    console.log(
      "Greedy sort tracks from store:",
      tracks.length,
      "out of",
      trackRefs.length
    );
    if (tracks.length === 0) {
      console.warn(
        "No tracks found in store for IDs:",
        trackRefs.map((r) => r.track_id)
      );
      return;
    }

    // Apply greedy sorting algorithm
    const enrichedPlaylist = tracks.map((track, idx) => {
      const t = track as TrackCompat;
      return {
        camelot_key: keyToCamelot(t.key),
        _vectors: t._vectors,
        energy: typeof t.energy === "number" ? t.energy : Number(t.energy) || 0,
        bpm: typeof t.bpm === "number" ? t.bpm : Number(t.bpm) || 0,
        idx,
      };
    });

    const compatibilityEdges = buildCompatibilityGraph(enrichedPlaylist);
    const optimalPath = greedyPath(enrichedPlaylist, compatibilityEdges);

    // Reorder track IDs based on optimal path
    const sortedTrackIds = optimalPath.map(
      (orderIdx) => tracks[enrichedPlaylist[orderIdx].idx].track_id
    );
    console.log("Greedy sorted track IDs:", sortedTrackIds);

    updateTrackIds(sortedTrackIds);
  };

  // Genetic sort mutation
  const geneticSortMutation = useMutation({
    mutationFn: async () => {
      const trackRefs = getTrackIds();
      if (trackRefs.length === 0) return [];

      // Get full track objects from track store for genetic algorithm
      const tracks = trackRefs
        .map((ref) => {
          let track = getTrack(ref.track_id);
          if (!track) {
            track = useTrackStore
              .getState()
              .getTrack(ref.track_id, ref.friend_id);
          }
          return track;
        })
        .filter(Boolean) as Track[];

      if (tracks.length === 0) return [];

      return await generateGeneticPlaylist(tracks);
    },
    onSuccess: (sortedTracks) => {
      if (sortedTracks.length > 0) {
        const sortedTrackIds = sortedTracks.map((track) => track.track_id);
        updateTrackIds(sortedTrackIds);
      }
    },
  });

  const sortGenetic = () => {
    geneticSortMutation.mutate();
  };

  return {
    moveTrack,
    removeFromPlaylist,
    addToPlaylist,
    clearPlaylist,
    sortGreedy,
    sortGenetic,
    isGeneticSorting: geneticSortMutation.isPending,
  };
}
