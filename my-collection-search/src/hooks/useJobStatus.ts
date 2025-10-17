"use client";

import { useQuery } from "@tanstack/react-query";
import { getJobStatus } from "@/services/jobService";

export function useJobStatus(jobId: string | null, options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      if (!jobId) return null;
      return await getJobStatus(jobId);
    },
    enabled: Boolean(jobId) && (options?.enabled !== false),
    refetchInterval: (query) => {
      // Stop polling if job is completed or failed
      const data = query.state.data;
      if (!data || data.status === "completed" || data.status === "failed") {
        return false;
      }
      // Poll every 2 seconds for active jobs
      return options?.refetchInterval ?? 2000;
    },
    staleTime: 0, // Always refetch
  });
}