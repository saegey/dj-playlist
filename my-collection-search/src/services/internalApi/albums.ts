import { z } from "zod";
import {
  albumDetailResponseSchema,
  albumDiscogsRawResponseSchema,
  albumSearchQuerySchema,
  albumSearchResponseSchema,
  albumUpdateBodySchema,
  albumUpdateResponseSchema,
  albumsCleanupSummaryResponseSchema,
  albumUpsertWithTracksResponseSchema,
  queueAlbumDownloadsResponseSchema,
} from "@/api-contract/schemas";
import type { UpdateAlbumWithTracksParams } from "@/types/albumMetadata";
import type { Album, Track } from "@/types/track";
import { http } from "@/services/http";
import { streamLines } from "@/services/sse";

export type AlbumDiscogsRawResponse = z.infer<
  typeof albumDiscogsRawResponseSchema
>;
export type AlbumSearchParams = z.input<typeof albumSearchQuerySchema>;
export type AlbumSearchApiResponse = z.infer<typeof albumSearchResponseSchema>;
export type AlbumSearchResponse = Omit<AlbumSearchApiResponse, "hits"> & {
  hits: Album[];
};
export type AlbumDetailApiResponse = z.infer<typeof albumDetailResponseSchema>;
export type AlbumDetailResponse = Omit<AlbumDetailApiResponse, "album" | "tracks"> & {
  album: Album;
  tracks: Track[];
};
export type AlbumUpdateParams = z.input<typeof albumUpdateBodySchema>;
export type AlbumUpdateApiResponse = z.infer<typeof albumUpdateResponseSchema>;
export type AlbumUpdateResponse = Omit<AlbumUpdateApiResponse, "album"> & {
  album: Album;
};
export type QueueAlbumDownloadsResponse = z.infer<
  typeof queueAlbumDownloadsResponseSchema
>;
export type AlbumsCleanupSummaryResponse = z.infer<
  typeof albumsCleanupSummaryResponseSchema
>;
export type UpsertAlbumWithTracksApiResponse = z.infer<
  typeof albumUpsertWithTracksResponseSchema
>;
export type UpsertAlbumWithTracksResponse = Omit<
  UpsertAlbumWithTracksApiResponse,
  "album" | "tracks"
> & {
  album: Album;
  tracks: Track[];
};

export async function fetchAlbumDiscogsRawRelease(
  releaseId: string,
  friendId: number
): Promise<AlbumDiscogsRawResponse> {
  return await http<AlbumDiscogsRawResponse>(
    `/api/albums/${encodeURIComponent(releaseId)}/discogs-raw?friend_id=${friendId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
}

export async function searchAlbums(
  params: AlbumSearchParams
): Promise<AlbumSearchResponse> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.append("q", params.q);
  if (params.sort) searchParams.append("sort", params.sort);
  if (typeof params.friend_id === "number") {
    searchParams.append("friend_id", String(params.friend_id));
  }
  if (typeof params.limit === "number") searchParams.append("limit", String(params.limit));
  if (typeof params.offset === "number") searchParams.append("offset", String(params.offset));

  const query = searchParams.toString();
  const path = query ? `/api/albums?${query}` : "/api/albums";
  return await http<AlbumSearchResponse>(path, {
    method: "GET",
    cache: "no-store",
  });
}

export async function getAlbumWithTracks(
  releaseId: string,
  friendId: number
): Promise<AlbumDetailResponse> {
  return await http<AlbumDetailResponse>(
    `/api/albums/${encodeURIComponent(releaseId)}?friend_id=${friendId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
}

export async function updateAlbum(
  params: AlbumUpdateParams
): Promise<AlbumUpdateResponse> {
  return await http<AlbumUpdateResponse>("/api/albums/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function queueAlbumDownloads(
  releaseId: string,
  friendId: number
): Promise<QueueAlbumDownloadsResponse> {
  return await http<QueueAlbumDownloadsResponse>(
    `/api/albums/${encodeURIComponent(releaseId)}/download?friend_id=${friendId}`,
    {
      method: "POST",
    }
  );
}

export async function upsertAlbumWithTracks(
  params: UpdateAlbumWithTracksParams
): Promise<UpsertAlbumWithTracksResponse> {
  const formData = new FormData();
  formData.append("release_id", params.release_id);
  formData.append("album", JSON.stringify(params.album));
  formData.append("tracks", JSON.stringify(params.tracks));
  formData.append("friend_id", params.friend_id.toString());

  if (params.coverArt) {
    formData.append("cover_art", params.coverArt);
  }

  return await http<UpsertAlbumWithTracksResponse>("/api/albums/upsert", {
    method: "POST",
    body: formData,
  });
}

export async function fetchAlbumsCleanupSummary(): Promise<AlbumsCleanupSummaryResponse> {
  return await http<AlbumsCleanupSummaryResponse>("/api/albums/cleanup", {
    method: "GET",
    cache: "no-store",
  });
}

export async function cleanupAlbumsStream(
  onLine?: (line: string) => void
): Promise<{ message: string }> {
  const lines: string[] = [];
  await streamLines("/api/albums/cleanup", { method: "POST" }, (line) => {
    lines.push(line);
    onLine?.(line);
  });
  return { message: lines.join("\n") };
}

export async function backfillAlbumsStream(
  onLine?: (line: string) => void
): Promise<{ message: string }> {
  const lines: string[] = [];
  await streamLines("/api/albums/backfill", { method: "POST" }, (line) => {
    lines.push(line);
    onLine?.(line);
  });
  return { message: lines.join("\n") };
}
