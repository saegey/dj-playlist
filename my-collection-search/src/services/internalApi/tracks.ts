import { z } from "zod";
import {
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
