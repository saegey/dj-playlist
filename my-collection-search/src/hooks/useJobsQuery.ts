"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJobs } from "@/services/jobsService";

export function useJobsQuery(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
    refetchInterval: options?.refetchInterval || 30000, // Default 30 seconds
    enabled: options?.enabled ?? true,
  });
}