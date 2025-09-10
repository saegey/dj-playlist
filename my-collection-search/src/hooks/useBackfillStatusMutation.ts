import { useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { BackfillTrack } from "@/components/backfill/types";
import { useTrackStore } from "@/stores/trackStore";

type TrackStatus = BackfillTrack["status"];

export type TrackStatusUpdate = {
  track_id: string;
  status?: TrackStatus;
  errorMsg?: string | null;
};

export function useBackfillStatusMutation() {
  const { updateTrack } = useTrackStore();

  return useMutation({
    mutationKey: queryKeys.tracksStatus(),
    mutationFn: async (updates: TrackStatusUpdate | TrackStatusUpdate[]) => {
      // No server call; this is purely optimistic UI update
      return Array.isArray(updates) ? updates : [updates];
    },
    onMutate: async (updates) => {
      const arr = Array.isArray(updates) ? updates : [updates];

      // Update tracks in Zustand store
      arr.forEach(update => {
        // Since BackfillTrack has status/errorMsg fields that Track doesn't,
        // we need to be careful about what we update
        const storeUpdate: Record<string, unknown> = {};
        if (update.status !== undefined) {
          storeUpdate.status = update.status;
        }
        if (update.errorMsg !== undefined) {
          storeUpdate.errorMsg = update.errorMsg;
        }
        
        // Update for default username since backfill typically doesn't specify username
        updateTrack(update.track_id, 'default', storeUpdate);
      });
    },
  });
}
