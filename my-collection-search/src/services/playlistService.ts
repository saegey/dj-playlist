// src/services/playlistService.ts
export async function importPlaylist(name: string, tracks: string[]) {
  const res = await fetch("/api/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, tracks }),
  });
  return res;
}

export async function fetchPlaylists() {
  const res = await fetch("/api/playlists");

  return await res.json();
}

export async function fetchPlaylistTrackIds(id: number): Promise<string[]> {
  const res = await fetch(`/api/playlists/${id}/tracks`);
  if (!res.ok) throw new Error("Failed to fetch playlist tracks");
  const data = await res.json();
  return Array.isArray(data.track_ids) ? data.track_ids : [];
}

// Generate a genetic ordering for a playlist via API and normalize the response
import type { Track } from "@/types/track";

export async function generateGeneticPlaylist(playlist: Track[]): Promise<Track[]> {
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

export async function updatePlaylist(id: number, data: { name?: string; tracks?: string[] }) {
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