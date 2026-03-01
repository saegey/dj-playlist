import { z } from "zod";
import {
  jobDetailsResponseSchema,
  jobsClearResponseSchema,
  jobsListQuerySchema,
  jobsListResponseSchema,
} from "@/api-contract/schemas";
import { http } from "@/services/http";

export type JobsListQuery = z.input<typeof jobsListQuerySchema>;
export type JobsListResponse = z.infer<typeof jobsListResponseSchema>;
export type JobDetailsResponse = z.infer<typeof jobDetailsResponseSchema>;
export type ClearAllJobsResponse = z.infer<typeof jobsClearResponseSchema>;

export async function fetchJobs(options: JobsListQuery = {}): Promise<JobsListResponse> {
  const params = new URLSearchParams();
  if (typeof options.limit === "number") params.set("limit", String(options.limit));
  if (typeof options.offset === "number") params.set("offset", String(options.offset));
  if (options.state) params.set("state", options.state);
  const query = params.toString();
  return await http<JobsListResponse>(`/api/jobs${query ? `?${query}` : ""}`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function clearAllJobs(): Promise<ClearAllJobsResponse> {
  return await http<ClearAllJobsResponse>("/api/jobs", {
    method: "DELETE",
  });
}

export async function getJobStatus(jobId: string): Promise<JobDetailsResponse> {
  return await http<JobDetailsResponse>(`/api/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
    cache: "no-store",
  });
}
