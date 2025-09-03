import { http } from "../http";

export type SpotifySyncStatus = {
  message?: string;
  newReleases: string[];
  alreadyHave: string[];
  total?: number;
  // (match your real shape)
};

export function ingestSpotifyIndex() {
  return http<{ message: string }>("/api/spotify/index", { method: "POST" });
}

export async function downloadSpotifyLibrary(username: string) {
  const url = `/api/spotify/download?spotify_username=${encodeURIComponent(username)}`;
  const res = await fetch(url);
  if (res.status === 401) {
    window.location.href = "/api/spotify/login";
    return null;
  }
  if (!res.ok) throw new Error("Failed to download Spotify library");
  return res.json() as Promise<SpotifySyncStatus>;
}