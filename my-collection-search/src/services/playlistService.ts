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
