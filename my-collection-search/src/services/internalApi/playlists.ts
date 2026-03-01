import { z } from "zod";
import {
  playlistCreateBodySchema,
  playlistDetailResponseSchema,
  playlistGeneticResponseSchema,
  playlistPatchBodySchema,
  playlistTrackInputSchema,
} from "@/api-contract/schemas";
import { http } from "@/services/http";
import type { Playlist, Track } from "@/types/track";

export type PlaylistTrackPayload = z.infer<typeof playlistTrackInputSchema>;
export type PlaylistTrackIdsResponse = z.infer<typeof playlistDetailResponseSchema>;
export type CreatePlaylistTracks = string[] | PlaylistTrackPayload[];

type PlaylistGeneticResponse = z.infer<typeof playlistGeneticResponseSchema>;

export async function importPlaylist(
  name: string,
  tracks: CreatePlaylistTracks,
  friendId?: number
): Promise<Playlist> {
  const normalizedTracks = tracks.map((track) =>
    typeof track === "string" ? { track_id: track } : track
  );
  const body: z.input<typeof playlistCreateBodySchema> = {
    name,
    tracks: normalizedTracks,
    default_friend_id: friendId,
  };

  return await http<Playlist>("/api/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function fetchPlaylists(): Promise<Playlist[]> {
  return await http<Playlist[]>("/api/playlists", {
    method: "GET",
    cache: "no-store",
  });
}

export async function fetchPlaylistTrackIds(
  id: number
): Promise<PlaylistTrackIdsResponse> {
  return await http<PlaylistTrackIdsResponse>(
    `/api/playlists/${encodeURIComponent(String(id))}/tracks`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
}

export async function generateGeneticPlaylist(playlist: Track[]): Promise<Track[]> {
  try {
    const data = await http<PlaylistGeneticResponse>("/api/playlists/genetic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlist }),
    });

    return Array.isArray(data.result)
      ? (data.result as Track[])
      : (Object.values(data.result || {}) as Track[]);
  } catch (error) {
    const err = error as Error & {
      data?: {
        error?: string;
        invalid?: Array<{ track_id?: string; reason?: string }>;
      };
    };
    const invalid = err.data?.invalid;
    if (Array.isArray(invalid)) {
      throw new Error(
        JSON.stringify({
          error: err.data?.error || err.message || "Invalid tracks for genetic playlist",
          invalid,
        })
      );
    }
    throw error;
  }
}

export async function updatePlaylist(
  id: number,
  data: { name?: string; tracks?: CreatePlaylistTracks }
): Promise<Playlist> {
  const body: z.input<typeof playlistPatchBodySchema> = { id, ...data };
  return await http<Playlist>("/api/playlists", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deletePlaylist(playlistId: number): Promise<void> {
  await http<{ success: boolean }>(
    `/api/playlists?id=${encodeURIComponent(String(playlistId))}`,
    {
      method: "DELETE",
    }
  );
}
