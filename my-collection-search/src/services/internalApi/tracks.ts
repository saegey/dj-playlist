import { z } from "zod";
import {
  similarVibeQuerySchema,
  similarVibeResponseSchema,
  trackPlaylistCountsBodySchema,
  trackPlaylistCountsResponseSchema,
  trackSearchGetQuerySchema,
  trackSearchGetResponseSchema,
  audioVibeEmbeddingDataSchema,
  audioVibeEmbeddingPreviewResponseSchema,
  bulkNotesBodySchema,
  bulkNotesResponseSchema,
  bulkNotesUpdateSchema,
  coverArtBackfillBodySchema,
  coverArtBackfillResponseSchema,
  durationBackfillResponseSchema,
  embeddingAudioVibePreviewApiResponseSchema,
  embeddingIdentityPreviewApiResponseSchema,
  embeddingPreviewResponseSchema,
  identityEmbeddingDataSchema,
  identityEmbeddingPreviewResponseSchema,
  trackAudioMetadataResponseSchema,
  trackEmbeddingPreviewResponseSchema,
  trackEssentiaResponseSchema,
  trackExtractEmbeddedCoverResponseSchema,
  trackPlaylistsResponseSchema,
  trackPlaylistMembershipSchema,
  essentiaBackfillBodySchema,
  essentiaBackfillResponseSchema,
} from "@/api-contract/schemas";
import { http } from "@/services/http";
import type { Track } from "@/types/track";
import type { TrackEditFormProps } from "@/components/track-edit/types";

export type TrackPlaylistMembership = z.infer<typeof trackPlaylistMembershipSchema>;
type TrackPlaylistsApiResponse = z.infer<typeof trackPlaylistsResponseSchema>;
export type TrackAudioMetadataResponse = z.infer<typeof trackAudioMetadataResponseSchema>;
export type TrackExtractEmbeddedCoverResponse = z.infer<
  typeof trackExtractEmbeddedCoverResponseSchema
>;
export type TrackEssentiaResponse = z.infer<typeof trackEssentiaResponseSchema>;
export type TrackEmbeddingPreviewResponse = z.infer<
  typeof trackEmbeddingPreviewResponseSchema
>;
type EmbeddingPreviewResponse = z.infer<typeof embeddingPreviewResponseSchema>;

export type IdentityEmbeddingData = z.infer<typeof identityEmbeddingDataSchema>;
export type IdentityEmbeddingPreviewResponse = z.infer<
  typeof identityEmbeddingPreviewResponseSchema
>;
export type AudioVibeEmbeddingData = z.infer<typeof audioVibeEmbeddingDataSchema>;
export type AudioVibeEmbeddingPreviewResponse = z.infer<
  typeof audioVibeEmbeddingPreviewResponseSchema
>;

export type DurationBackfillResponse = z.infer<
  typeof durationBackfillResponseSchema
>;
export type TrackBatchRef = {
  friend_id: number;
  track_id: string;
};
export type TrackPlaylistCountRef = z.input<typeof trackPlaylistCountsBodySchema>["track_refs"][number];
export type TrackPlaylistCountsResponse = z.infer<
  typeof trackPlaylistCountsResponseSchema
>;
export type SimilarVibeTracksOptions = z.input<typeof similarVibeQuerySchema>;
type SimilarVibeTracksResponseApi = z.infer<typeof similarVibeResponseSchema>;
export type SimilarVibeTrack = Track & {
  distance: number;
  identity_text: string;
};
export type SimilarVibeTracksResponse = Omit<SimilarVibeTracksResponseApi, "tracks"> & {
  tracks: SimilarVibeTrack[];
};
export type TrackSearchQuery = z.input<typeof trackSearchGetQuerySchema>;
type TrackSearchApiResponse = z.infer<typeof trackSearchGetResponseSchema>;
export type TrackSearchResponse = Omit<TrackSearchApiResponse, "hits"> & {
  hits: Track[];
};
export type BulkNotesUpdate = z.input<typeof bulkNotesUpdateSchema>;
type BulkNotesApiResponse = z.infer<typeof bulkNotesResponseSchema>;
export type BulkNotesResponse = Omit<BulkNotesApiResponse, "tracks"> & {
  tracks?: Track[];
};
export type CoverArtBackfillBody = z.input<typeof coverArtBackfillBodySchema>;
export type CoverArtBackfillResponse = z.infer<
  typeof coverArtBackfillResponseSchema
>;
export type EssentiaBackfillBody = z.input<typeof essentiaBackfillBodySchema>;
export type EssentiaBackfillResponse = z.infer<
  typeof essentiaBackfillResponseSchema
>;
export type AnalyzeArgs = {
  track_id: string;
  friend_id: number;
  apple_music_url?: string | null;
  youtube_url?: string | null;
  soundcloud_url?: string | null;
};
export type AnalyzeResponse = {
  rhythm?: { bpm?: number; danceability?: number };
  tonal?: { key_edma?: { key?: string; scale?: string } };
  metadata?: { audio_properties?: { length: number } };
  [k: string]: unknown;
};
export type AsyncAnalyzeResponse = {
  success: boolean;
  jobId: string;
  message: string;
};
export type UploadTrackAudioArgs = {
  file: File;
  track_id: string;
};
export type UploadTrackAudioResponse = {
  analysis: AnalyzeResponse;
  [k: string]: unknown;
};
export type TrackMetadataArgs = { prompt: string; friend_id?: number };
export type TrackMetadataResponse = { genre?: string; notes?: string } & Record<
  string,
  unknown
>;
export type MissingAppleTracksArgs = {
  page: number;
  pageSize: number;
  friendId?: number | null;
};
export type MissingAppleTracksResponse = {
  tracks: Track[];
  total: number;
};

export async function fetchTracksByIds(tracks: TrackBatchRef[]): Promise<Track[]> {
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
}): Promise<{ embedding: number[] }> {
  return await http<{ embedding: number[] }>("/api/tracks/vectorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export async function recalcTrackDuration(args: {
  track_id: string;
  friend_id: number;
}): Promise<{ jobId: string }> {
  return await http<{ jobId: string }>("/api/tracks/fix-duration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export async function analyzeTrackAsync(
  args: AnalyzeArgs & { title?: string; artist?: string }
): Promise<AsyncAnalyzeResponse> {
  return await http<AsyncAnalyzeResponse>("/api/tracks/analyze-async", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export async function analyzeLocalAudioAsync(args: {
  track_id: string;
  friend_id: number;
  local_audio_url?: string | null;
}): Promise<AsyncAnalyzeResponse> {
  return await http<AsyncAnalyzeResponse>("/api/tracks/analyze-local-async", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export async function syncTrackYearFromAudio(args: {
  track_id: string;
  friend_id: number;
}): Promise<{
  success: boolean;
  year: string;
  previous_year?: string | number | null;
  message: string;
}> {
  return await http<{
    success: boolean;
    year: string;
    previous_year?: string | number | null;
    message: string;
  }>(`/api/tracks/${encodeURIComponent(args.track_id)}/sync-audio-year`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ friend_id: args.friend_id }),
  });
}

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

export async function fetchTrackPlaylists(
  trackId: string,
  friendId: number
): Promise<TrackPlaylistMembership[]> {
  const data = await http<TrackPlaylistsApiResponse>(
    `/api/tracks/${encodeURIComponent(trackId)}/playlists?friend_id=${friendId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return Array.isArray(data.playlists) ? data.playlists : [];
}

export async function fetchTrackAudioMetadata(
  trackId: string,
  friendId: number
): Promise<TrackAudioMetadataResponse> {
  return await http<TrackAudioMetadataResponse>(
    `/api/tracks/${encodeURIComponent(trackId)}/audio-metadata?friend_id=${friendId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
}

export async function extractEmbeddedCover(
  trackId: string,
  friendId: number
): Promise<string> {
  const data = await http<TrackExtractEmbeddedCoverResponse>(
    `/api/tracks/${encodeURIComponent(trackId)}/audio-metadata`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friend_id: friendId }),
    }
  );

  return String(data.audio_file_album_art_url || "");
}

export async function fetchTrackEssentiaData(
  trackId: string,
  friendId: number
): Promise<TrackEssentiaResponse> {
  return await http<TrackEssentiaResponse>(
    `/api/tracks/${encodeURIComponent(trackId)}/essentia?friend_id=${friendId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
}

export async function fetchTrackEmbeddingPreview(
  trackId: string,
  friendId: number
): Promise<TrackEmbeddingPreviewResponse> {
  return await http<TrackEmbeddingPreviewResponse>(
    `/api/tracks/${encodeURIComponent(trackId)}/embedding-preview?friend_id=${friendId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
}

export async function fetchIdentityEmbeddingPreview(
  trackId: string,
  friendId: number
): Promise<IdentityEmbeddingPreviewResponse> {
  const preview = await http<EmbeddingPreviewResponse>(
    `/api/embeddings/preview?track_id=${encodeURIComponent(trackId)}&friend_id=${friendId}&type=identity`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
  const parsed = embeddingIdentityPreviewApiResponseSchema.parse(preview);
  return identityEmbeddingPreviewResponseSchema.parse({
    identityText: parsed.text,
    identityData: parsed.data,
  });
}

export async function fetchAudioVibeEmbeddingPreview(
  trackId: string,
  friendId: number
): Promise<AudioVibeEmbeddingPreviewResponse> {
  const preview = await http<EmbeddingPreviewResponse>(
    `/api/embeddings/preview?track_id=${encodeURIComponent(trackId)}&friend_id=${friendId}&type=audio_vibe`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
  const parsed = embeddingAudioVibePreviewApiResponseSchema.parse(preview);
  return audioVibeEmbeddingPreviewResponseSchema.parse({
    vibeText: parsed.text,
    vibeData: parsed.data,
  });
}

export async function queueFixMissingDurations(): Promise<DurationBackfillResponse> {
  return await http<DurationBackfillResponse>("/api/tracks/fix-missing-durations", {
    method: "POST",
  });
}

export async function fetchSimilarVibeTracks(
  options: SimilarVibeTracksOptions
): Promise<SimilarVibeTracksResponse> {
  const params = new URLSearchParams({
    track_id: options.track_id,
    friend_id: String(options.friend_id),
  });
  if (typeof options.limit === "number") params.set("limit", String(options.limit));
  if (typeof options.ivfflat_probes === "number") {
    params.set("ivfflat_probes", String(options.ivfflat_probes));
  }

  return await http<SimilarVibeTracksResponse>(
    `/api/embeddings/similar-vibe?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
}

export async function searchTracks(
  query: TrackSearchQuery
): Promise<TrackSearchResponse> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (typeof query.limit === "number") params.set("limit", String(query.limit));
  if (typeof query.offset === "number") params.set("offset", String(query.offset));
  if (query.filter) params.set("filter", query.filter);

  const search = params.toString();
  const path = search ? `/api/tracks/search?${search}` : "/api/tracks/search";
  return await http<TrackSearchResponse>(path, {
    method: "GET",
    cache: "no-store",
  });
}

export async function fetchPlaylistCounts(
  track_refs: TrackPlaylistCountRef[]
): Promise<TrackPlaylistCountsResponse> {
  if (!track_refs || track_refs.length === 0) return {};
  const body: z.input<typeof trackPlaylistCountsBodySchema> = { track_refs };
  return await http<TrackPlaylistCountsResponse>("/api/tracks/playlist_counts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function bulkUpdateTrackNotes(
  updates: BulkNotesUpdate[]
): Promise<BulkNotesResponse> {
  const body: z.input<typeof bulkNotesBodySchema> = { updates };
  return await http<BulkNotesResponse>("/api/tracks/bulk-notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function queueExtractMissingCoverArt(
  body: CoverArtBackfillBody = {}
): Promise<CoverArtBackfillResponse> {
  return await http<CoverArtBackfillResponse>("/api/tracks/extract-missing-cover-art", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function queueBackfillEssentia(
  body: EssentiaBackfillBody = {}
): Promise<EssentiaBackfillResponse> {
  return await http<EssentiaBackfillResponse>("/api/tracks/backfill-essentia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

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
