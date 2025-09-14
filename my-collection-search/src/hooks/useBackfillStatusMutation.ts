import { useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { BackfillTrack } from "@/components/backfill/types";
import { useTrackStore } from "@/stores/trackStore";

type TrackStatus = BackfillTrack["status"];

export type TrackStatusUpdate = {
  track_id: string;
  friend_id?: number; // enable precise store updates
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
      arr.forEach((update) => {
        // Since BackfillTrack has status/errorMsg fields that Track doesn't,
        // we need to be careful about what we update
        const storeUpdate: Partial<BackfillTrack> = {};
        if (update.status !== undefined) {
          storeUpdate.status = update.status;
        }
        if (update.errorMsg !== undefined) {
          storeUpdate.errorMsg = update.errorMsg ?? undefined;
        }

        // Determine friend_id: use provided, else find from store by track_id
        let fid = update.friend_id;
        if (typeof fid !== "number") {
          const state = useTrackStore.getState();
          for (const t of state.tracks.values()) {
            if (
              t.track_id === update.track_id &&
              typeof t.friend_id === "number"
            ) {
              fid = t.friend_id;
              break;
            }
          }
        }
        if (typeof fid === "number") {
          // updateTrack accepts Partial<Track>; BackfillTrack extends Track with extra fields.
          // Type cast to Partial<unknown> then to Partial<Track> is safe for overlapping keys.
          updateTrack(
            update.track_id,
            fid,
            storeUpdate as unknown as Partial<import("@/types/track").Track>
          );
        }
      });
    },
  });
}
