"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveTrack } from "@/services/trackService";
import type { TrackEditFormProps } from "@/components/TrackEditForm";
import { useTracksCacheUpdater } from "@/hooks/useTracksCacheUpdater";

// Shape returned by saveTrack is void; customize if API starts returning a Track

export function useTracksQuery() {
  const queryClient = useQueryClient();
  const { updateTracksInCache } = useTracksCacheUpdater();

  const saveTrackMutation = useMutation({
    mutationFn: async (data: TrackEditFormProps) => {
      return await saveTrack(data);
    },
    onSuccess: (updatedTrack) => {
      // Use server-updated Track for cache merge
      const { track_id, ...rest } = updatedTrack;
      updateTracksInCache({ track_id, ...rest });
      // Fallback: ensure consistency by refetching in background
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
    },
  });

  return {
    saveTrack: (data: TrackEditFormProps) =>
      saveTrackMutation.mutateAsync(data),
    saveTrackLoading: saveTrackMutation.isPending,
  };
}
