// src/services/playlistService.ts
export async function importPlaylist(
  name: string,
  tracks: string[] | Array<{ track_id: string; friend_id: number }>,
  friendId?: number
) {
  const res = await fetch("/api/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      tracks,
      default_friend_id: friendId,
    }),
  });
  return res;
}

export async function fetchPlaylists() {
  const res = await fetch("/api/playlists");

  return await res.json();
}

export async function fetchPlaylistTrackIds(
  id: number
): Promise<{ track_id: string; friend_id: number; position: number }[]> {
  const res = await fetch(`/api/playlists/${id}/tracks`);
  if (!res.ok) throw new Error("Failed to fetch playlist tracks");
  const data = await res.json();
  console.log("Fetched playlist track ids:", data);
  return data.tracks;
}

// Generate a genetic ordering for a playlist via API and normalize the response
import type { Track } from "@/types/track";

export async function generateGeneticPlaylist(
  playlist: Track[]
): Promise<Track[]> {
  const res = await fetch("/api/playlists/genetic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playlist }),
  });
  if (!res.ok) throw new Error("Failed to generate genetic playlist");

  const data = await res.json();
  console.log("Genetic playlist response data:", data);
  if (data.detail) {
    throw new Error(data.detail);
  }
  const result = Array.isArray(data.result)
    ? (data.result as Track[])
    : (Object.values(data.result || {}) as Track[]);
  return result;
}

export async function updatePlaylist(
  id: number,
  data: { name?: string; tracks?: { track_id: string; friend_id: number }[] }
) {
  const res = await fetch("/api/playlists", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  return res;
}

export async function deletePlaylist(playlistId: number): Promise<void> {
  const res = await fetch(`/api/playlists?id=${playlistId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete playlist");
  }
}
