"use client";

import { useMutation } from "@tanstack/react-query";
import {
  bulkUpdateTrackNotes,
  type BulkNotesUpdate,
  type BulkNotesResponse,
} from "@/services/trackService";
import { useTrackStore } from "@/stores/trackStore";

export function useBulkUpdateTrackNotesMutation() {
  const setTrack = useTrackStore((state) => state.setTrack);

  return useMutation<BulkNotesResponse, Error, BulkNotesUpdate[]>({
    mutationFn: async (updates: BulkNotesUpdate[]) => bulkUpdateTrackNotes(updates),
    onSuccess: (data) => {
      // Update Zustand store with the updated tracks
      // Use setTrack (not setTracks) to ensure updates are applied
      // setTracks preserves certain fields, but we want to apply server updates here
      if (data.tracks && data.tracks.length > 0) {
        data.tracks.forEach((track) => {
          setTrack(track);
        });
      }
    },
  });
}
