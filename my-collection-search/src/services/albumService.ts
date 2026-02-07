// Client-side service for album API calls
import { Album, Track } from "@/types/track";

export interface AlbumSearchParams {
  q?: string;
  sort?: string;
  friend_id?: number;
  limit?: number;
  offset?: number;
}

export interface AlbumSearchResponse {
  hits: Album[];
  estimatedTotalHits: number;
  offset: number;
  limit: number;
  query: string;
  sort: string;
}

export interface AlbumUpdateParams {
  release_id: string;
  friend_id: number;
  album_rating?: number;
  album_notes?: string;
  purchase_price?: number;
  condition?: string;
  library_identifier?: string | null;
}

/**
 * Search and list albums
 */
export async function searchAlbums(
  params: AlbumSearchParams
): Promise<AlbumSearchResponse> {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.append("q", params.q);
  if (params.sort) searchParams.append("sort", params.sort);
  if (params.friend_id) searchParams.append("friend_id", params.friend_id.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.offset) searchParams.append("offset", params.offset.toString());

  const res = await fetch(`/api/albums?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to search albums");

  return await res.json();
}

/**
 * Update album metadata (rating, notes, price, condition)
 */
export async function updateAlbum(
  params: AlbumUpdateParams
): Promise<{ success: boolean; album: Album }> {
  const res = await fetch("/api/albums/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update album");
  }

  return await res.json();
}

/**
 * Trigger backfill of albums from Discogs exports
 * Returns a ReadableStream for progress updates
 */
export async function backfillAlbums(): Promise<Response> {
  const res = await fetch("/api/albums/backfill", {
    method: "POST",
  });

  if (!res.ok) throw new Error("Failed to start album backfill");

  return res;
}

/**
 * Fetch a single album with its tracks
 */
export async function getAlbumWithTracks(
  releaseId: string,
  friendId: number
): Promise<{ album: Album; tracks: Track[] }> {
  const res = await fetch(
    `/api/albums/${releaseId}?friend_id=${friendId}`
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch album");
  }

  return await res.json();
}
