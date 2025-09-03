import { http } from "../http";
import { streamLines } from "../sse";

export type SyncResult = {
  message?: string;
  newReleases: string[];
  alreadyHave: string[];
  total?: number;
  totalCollection?: number;
  newCount?: number;
  errors?: { releaseId: string; error: string }[];
};
export type IndexResult = { message?: string };

export function updateDiscogsIndex() {
  return http<IndexResult>("/api/discogs/update-index", { method: "POST" });
}

export async function syncDiscogsStream(
  username: string | undefined,
  onLine: (line: string) => void
) {
  const url = username
    ? `/api/discogs?username=${encodeURIComponent(username)}`
    : "/api/discogs";
  await streamLines(url, { method: "GET" }, onLine);
}