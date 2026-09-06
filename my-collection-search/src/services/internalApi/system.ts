import { http } from "@/services/http";

export interface VersionInfo {
  version: string;
  gitSha: string | null;
  builtAt: string | null;
  nodeEnv: string;
}

export type ServiceStatus = "up" | "down" | "unknown";

export interface ServiceHealth {
  service: string;
  status: ServiceStatus;
  latencyMs: number | null;
  detail?: string;
}

export interface StatusInfo {
  services: ServiceHealth[];
  checkedAt: string;
}

export function fetchVersionInfo(): Promise<VersionInfo> {
  return http<VersionInfo>("/api/version");
}

export function fetchStatusInfo(): Promise<StatusInfo> {
  return http<StatusInfo>("/api/status");
}
