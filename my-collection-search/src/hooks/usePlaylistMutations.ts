import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { generateGeneticPlaylist, updatePlaylist } from "@/services/playlistService";
import type { Track } from "@/types/track";
import { useTrackStore } from "@/stores/trackStore";
import { toaster } from "@/components/ui/toaster";
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

  // Update track refs in cache
  const updateTrackRefs = (newTrackRefs: TrackRef[]) => {
    if (!playlistId) return;
    queryClient.setQueryData(
      queryKeys.playlistTrackIds(playlistId),
      newTrackRefs
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

    updateTrackRefs(newRefs);
  };

  // Mutation for removing track from playlist
  const removeTrackMutation = useMutation({
    mutationFn: async (trackIdToRemove: string) => {
      if (!playlistId) throw new Error("No playlist ID");
      const trackRefs = getTrackIds();
      const newRefs = trackRefs.filter((r) => r.track_id !== trackIdToRemove);
      const res = await updatePlaylist(playlistId, { tracks: newRefs });
      if (!res.ok) throw new Error("Failed to remove track from playlist");
      return newRefs;
    },
    onSuccess: (newRefs) => {
      updateTrackRefs(newRefs);
      toaster.create({ title: "Track removed from playlist", type: "success" });
    },
    onError: (error) => {
      console.error("Failed to remove track from playlist:", error);
      toaster.create({ title: "Failed to remove track from playlist", type: "error" });
    }
  });

  // Mutation for adding track to playlist  
  const addTrackMutation = useMutation({
    mutationFn: async (track: Track) => {
      if (!playlistId) throw new Error("No playlist ID");
      const trackRefs = getTrackIds();
      if (trackRefs.some((r) => r.track_id === track.track_id)) {
        return trackRefs; // Track already exists, no change needed
      }
      const newRefs = [...trackRefs, { track_id: track.track_id, friend_id: track.friend_id! }];
      const res = await updatePlaylist(playlistId, { tracks: newRefs });
      if (!res.ok) throw new Error("Failed to add track to playlist");
      return newRefs;
    },
    onSuccess: (newRefs, track) => {
      updateTrackRefs(newRefs);
      toaster.create({ title: `"${track.title}" added to playlist`, type: "success" });
    },
    onError: (error) => {
      console.error("Failed to add track to playlist:", error);
      toaster.create({ title: "Failed to add track to playlist", type: "error" });
    }
  });

  // Remove track from playlist (with server persistence)
  const removeFromPlaylist = (trackIdToRemove: string) => {
    removeTrackMutation.mutate(trackIdToRemove);
  };

  // Add track to playlist (with server persistence) 
  const addToPlaylist = (track: Track) => {
    addTrackMutation.mutate(track);
  };

  // Clear entire playlist
  const clearPlaylist = () => {
    updateTrackRefs([]);
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

    // Reorder track refs based on optimal path
    const sortedTrackRefs = optimalPath.map((orderIdx) => {
      const track = tracks[enrichedPlaylist[orderIdx].idx];
      return { track_id: track.track_id, friend_id: track.friend_id! };
    });
    console.log("Greedy sorted track refs:", sortedTrackRefs);

    updateTrackRefs(sortedTrackRefs);
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
        const sortedTrackRefs = sortedTracks.map((track) => ({
          track_id: track.track_id,
          friend_id: track.friend_id!
        }));
        updateTrackRefs(sortedTrackRefs);
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
