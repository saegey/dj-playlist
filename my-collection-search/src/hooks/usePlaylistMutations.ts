import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { generateGeneticPlaylist } from '@/services/playlistService';
import type { Track } from '@/types/track';
import { 
  buildCompatibilityGraph, 
  greedyPath, 
  keyToCamelot, 
  TrackCompat 
} from '@/lib/playlistOrder';

/**
 * Hook for playlist mutation operations (sort, clear, reorder)
 * Works with query-based playlist data
 */
export function usePlaylistMutations(playlistId?: number) {
  const queryClient = useQueryClient();
  
  // Get current track IDs from cache
  const getTrackIds = (): string[] => {
    if (!playlistId) return [];
    return queryClient.getQueryData(queryKeys.playlistTrackIds(playlistId)) || [];
  };

  // Update track IDs in cache
  const updateTrackIds = (newTrackIds: string[]) => {
    if (!playlistId) return;
    queryClient.setQueryData(queryKeys.playlistTrackIds(playlistId), newTrackIds);
  };

  // Move track from one position to another
  const moveTrack = (fromIdx: number, toIdx: number) => {
    const trackIds = getTrackIds();
    if (fromIdx < 0 || fromIdx >= trackIds.length || toIdx < 0 || toIdx >= trackIds.length) {
      return;
    }
    
    const newTrackIds = [...trackIds];
    const [moved] = newTrackIds.splice(fromIdx, 1);
    newTrackIds.splice(toIdx, 0, moved);
    
    updateTrackIds(newTrackIds);
  };

  // Remove track from playlist
  const removeFromPlaylist = (trackIdToRemove: string) => {
    const trackIds = getTrackIds();
    const newTrackIds = trackIds.filter(id => id !== trackIdToRemove);
    updateTrackIds(newTrackIds);
  };

  // Clear entire playlist
  const clearPlaylist = () => {
    updateTrackIds([]);
  };

  // Sort playlist using greedy algorithm
  const sortGreedy = () => {
    const trackIds = getTrackIds();
    if (trackIds.length === 0) return;

    // Get tracks from cache or store
    const tracks = trackIds
      .map(id => {
        const trackData = queryClient.getQueryData(queryKeys.playlistTracks([id]));
        return Array.isArray(trackData) ? trackData[0] : null;
      })
      .filter(Boolean) as Track[];

    if (tracks.length === 0) return;

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
    const sortedTrackIds = optimalPath.map(orderIdx => 
      tracks[enrichedPlaylist[orderIdx].idx].track_id
    );
    
    updateTrackIds(sortedTrackIds);
  };

  // Genetic sort mutation
  const geneticSortMutation = useMutation({
    mutationFn: async () => {
      const trackIds = getTrackIds();
      if (trackIds.length === 0) return [];

      // Get full track objects for genetic algorithm
      const tracks = trackIds
        .map(id => {
          const trackData = queryClient.getQueryData(queryKeys.playlistTracks([id]));
          return Array.isArray(trackData) ? trackData[0] : null;
        })
        .filter(Boolean) as Track[];

      if (tracks.length === 0) return [];

      return await generateGeneticPlaylist(tracks);
    },
    onSuccess: (sortedTracks) => {
      if (sortedTracks.length > 0) {
        const sortedTrackIds = sortedTracks.map(track => track.track_id);
        updateTrackIds(sortedTrackIds);
      }
    }
  });

  const sortGenetic = () => {
    geneticSortMutation.mutate();
  };

  return {
    moveTrack,
    removeFromPlaylist,
    clearPlaylist,
    sortGreedy,
    sortGenetic,
    isGeneticSorting: geneticSortMutation.isPending,
  };
}