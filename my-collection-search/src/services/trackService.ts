import { TrackEditFormProps } from "@/components/TrackEditForm";
import type { Track } from "@/types/track";
import { http } from "./http";

/**
 * Fetch full track objects by Meili/DB track IDs.
 * @param trackIds Array of track_id strings
 * @returns Array of Track objects
 * @throws Error when the request fails
 */
export async function fetchTracksByIds(
  tracks: {
    friend_id: number;
    track_id: string;
  }[]
): Promise<Track[]> {
  if (!tracks || tracks.length === 0) return [];
  return await http<Track[]>("/api/tracks/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tracks }),
  });
}

export async function saveTrack(data: TrackEditFormProps): Promise<Track> {
  return await http<Track>("/api/tracks/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function vectorizeTrack(args: {
  track_id: string;
  friend_id: number;
}): Promise<void> {
  await http<unknown>("/api/tracks/vectorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export type AnalyzeArgs = {
  track_id: string;
  friend_id: number;
  apple_music_url?: string | null;
  youtube_url?: string | null;
  soundcloud_url?: string | null;
  spotify_url?: string | null;
};

export type AnalyzeResponse = {
  rhythm?: { bpm?: number; danceability?: number };
  tonal?: { key_edma?: { key?: string; scale?: string } };
  metadata?: { audio_properties?: { length: number } };
  // allow passthrough of any extra fields
  [k: string]: unknown;
};

export async function analyzeTrack(
  args: AnalyzeArgs
): Promise<AnalyzeResponse> {
  return await http<AnalyzeResponse>("/api/tracks/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export type AsyncAnalyzeResponse = {
  success: boolean;
  jobId: string;
  message: string;
};

export async function analyzeTrackAsync(
  args: AnalyzeArgs
): Promise<AsyncAnalyzeResponse> {
  return await http<AsyncAnalyzeResponse>("/api/tracks/analyze-async", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export type UploadTrackAudioArgs = {
  file: File;
  track_id: string;
};

export type UploadTrackAudioResponse = {
  analysis: AnalyzeResponse;
  [k: string]: unknown;
};

export async function uploadTrackAudio(
  args: UploadTrackAudioArgs
): Promise<UploadTrackAudioResponse> {
  const formData = new FormData();
  formData.append("file", args.file);
  formData.append("track_id", args.track_id);
  return await http<UploadTrackAudioResponse>("/api/tracks/upload", {
    method: "POST",
    body: formData,
  });
}

export type TrackMetadataArgs = { prompt: string };
export type TrackMetadataResponse = { genre?: string; notes?: string } & Record<
  string,
  unknown
>;

export async function fetchTrackMetadata(
  args: TrackMetadataArgs
): Promise<TrackMetadataResponse> {
  return await http<TrackMetadataResponse>("/api/ai/track-metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export async function fetchTrackById(params: {
  track_id: string;
  friend_id: number;
}): Promise<Track> {
  const url = `/api/tracks/${encodeURIComponent(
    params.track_id
  )}?friend_id=${encodeURIComponent(params.friend_id)}`;
  return await http<Track>(url, { method: "GET", cache: "no-store" });
}

export type BulkNotesUpdate = {
  track_id: string;
  local_tags?: string;
  notes?: string;
  // allow extra fields to be passed through without typing everything here
  [k: string]: unknown;
};

export type BulkNotesResponse = {
  updated?: number;
  [k: string]: unknown;
};

export async function bulkUpdateTrackNotes(
  updates: BulkNotesUpdate[]
): Promise<BulkNotesResponse> {
  return await http<BulkNotesResponse>("/api/tracks/bulk-notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });
}

// Fetch a map of track_id -> number of playlists the track appears in
export async function fetchPlaylistCounts(
  track_ids: string[]
): Promise<Record<string, number>> {
  if (!track_ids || track_ids.length === 0) return {};
  return await http<Record<string, number>>("/api/tracks/playlist_counts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ track_ids }),
  });
}

export type MissingAppleTracksArgs = {
  page: number;
  pageSize: number;
  friendId?: number | null;
};

export type MissingAppleTracksResponse = {
  tracks: Track[];
  total: number;
};

export async function fetchMissingAppleTracks(
  args: MissingAppleTracksArgs
): Promise<MissingAppleTracksResponse> {
  let url = `/api/tracks/missing-apple-music?page=${args.page}&pageSize=${args.pageSize}`;
  if (args.friendId) url += `&friendId=${encodeURIComponent(args.friendId)}`;
  const raw = await http<unknown>(url, { method: "GET", cache: "no-store" });
  if (Array.isArray(raw)) {
    const tracks = raw as Track[];
    return { tracks, total: tracks.length };
  }
  const obj = raw as { tracks?: Track[]; total?: number };
  const tracks = Array.isArray(obj.tracks) ? obj.tracks : [];
  const total = typeof obj.total === "number" ? obj.total : tracks.length;
  return { tracks, total };
}
