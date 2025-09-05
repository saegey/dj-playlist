// hooks/useBackupsQuery.ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backupDatabase, fetchBackups } from "@/services/internalApi/backup";

export function useBackupsQuery() {
  const qc = useQueryClient();
  const { data: backups = [], isLoading } = useQuery({
    queryKey: ["backups"],
    queryFn: async () => {
      const data = await fetchBackups();
      return data.files;
    },
  });

  const addBackup = useMutation({
    mutationFn: () => backupDatabase(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backups"] }),
  });

  return {
    backups,
    backupsLoading: isLoading,
    addBackup,
    addBackupLoading: addBackup.isPending,
  };
}
