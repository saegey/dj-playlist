"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveTrack } from "@/services/trackService";
import type { TrackEditFormProps } from "@/components/TrackEditForm";

// Shape returned by saveTrack is void; customize if API starts returning a Track

export function useTracksQuery() {
  const queryClient = useQueryClient();

  const saveTrackMutation = useMutation({
    mutationFn: async (data: TrackEditFormProps) => {
      await saveTrack(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchResults"] });
    },
  });

  return {
    saveTrack: (data: TrackEditFormProps) =>
      saveTrackMutation.mutateAsync(data),
    saveTrackLoading: saveTrackMutation.isPending,
  };
}
