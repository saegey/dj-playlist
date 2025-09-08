"use client";

import { useMutation } from "@tanstack/react-query";
import { restoreDatabase, type RestoreDatabaseResponse } from "@/services/backupService";

export function useRestoreDatabaseMutation() {
  return useMutation<RestoreDatabaseResponse, Error, File>({
    mutationFn: async (file: File) => restoreDatabase(file),
  });
}
