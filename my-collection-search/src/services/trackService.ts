import type { Track } from "@/types/track";

/**
 * Fetch full track objects by Meili/DB track IDs.
 * @param trackIds Array of track_id strings
 * @returns Array of Track objects
 * @throws Error when the request fails
 */
export async function fetchTracksByIds(trackIds: string[]): Promise<Track[]> {
  if (!trackIds || trackIds.length === 0) return [];
  const res = await fetch("/api/tracks/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ track_ids: trackIds }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch tracks by IDs: ${res.status} ${text}`);
  }
  return (await res.json()) as Track[];
}
