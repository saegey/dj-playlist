import { TrackEditFormProps } from "@/components/TrackEditForm";
import type { Track } from "@/types/track";
import { http } from "./http";

/**
 * Fetch full track objects by Meili/DB track IDs.
 * @param trackIds Array of track_id strings
 * @returns Array of Track objects
 * @throws Error when the request fails
 */
export async function fetchTracksByIds(trackIds: string[]): Promise<Track[]> {
  if (!trackIds || trackIds.length === 0) return [];
  return await http<Track[]>("/api/tracks/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ track_ids: trackIds }),
  });
}

export async function saveTrack(data: TrackEditFormProps): Promise<void> {
  await http<unknown>("/api/tracks/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
