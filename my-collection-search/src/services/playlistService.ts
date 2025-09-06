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
