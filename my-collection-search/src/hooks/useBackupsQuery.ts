// hooks/useBackupsQuery.ts
"use client";
import { useMutation } from "@tanstack/react-query";
import { backupDatabase } from "@/services/internalApi/backup";

export function useBackupDatabase() {
  return useMutation<{ message: string }, Error, void>({
    mutationFn: () => backupDatabase(),
  });
}
