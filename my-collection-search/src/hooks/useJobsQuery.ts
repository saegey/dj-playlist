"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJobs } from "@/services/jobsService";

export function useJobsQuery(options?: {
  enabled?: boolean;
  refetchInterval?: number;
  limit?: number;
  offset?: number;
  state?: "all" | "waiting" | "active" | "completed" | "failed";
}) {
  return useQuery({
    queryKey: ["jobs", options?.limit, options?.offset, options?.state],
    queryFn: () =>
      fetchJobs({
        limit: options?.limit,
        offset: options?.offset,
        state: options?.state,
      }),
    refetchInterval: options?.refetchInterval || 60000, // Default 60 seconds
    enabled: options?.enabled ?? true,
  });
}
