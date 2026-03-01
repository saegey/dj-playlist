"use client";

import { useQuery } from "@tanstack/react-query";
import { getJobStatus } from "@/services/internalApi/jobs";

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
    enabled: Boolean(jobId) && options?.enabled !== false,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.state === "completed" || data.state === "failed") {
        return false;
      }
      return options?.refetchInterval ?? 2000;
    },
    staleTime: 0,
  });
}
