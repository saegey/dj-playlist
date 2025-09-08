"use client";

import { useMutation } from "@tanstack/react-query";
import {
  bulkUpdateTrackNotes,
  type BulkNotesUpdate,
  type BulkNotesResponse,
} from "@/services/trackService";

export function useBulkUpdateTrackNotesMutation() {
  return useMutation<BulkNotesResponse, Error, BulkNotesUpdate[]>({
    mutationFn: async (updates: BulkNotesUpdate[]) => bulkUpdateTrackNotes(updates),
  });
}
