import { http } from "./http";
import type { YoutubeVideo } from "@/types/track";
import type { AppleMusicResult } from "@/types/apple";

export type YouTubeMusicSearchArgs = {
  title?: string;
  artist?: string;
};

export type YouTubeMusicSearchResponse = {
  results: YoutubeVideo[];
  [k: string]: unknown;
};

export async function fetchYouTubeMusicSearch(
  args: YouTubeMusicSearchArgs
): Promise<YouTubeMusicSearchResponse> {
  return await http<YouTubeMusicSearchResponse>(
    "/api/ai/youtube-music-search",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    }
  );
}

export type AppleMusicAISearchArgs = {
  title?: string;
  artist?: string;
  album?: string;
  isrc?: string;
};

export type AppleMusicAISearchResponse = {
  results: AppleMusicResult[];
  [k: string]: unknown;
};

export async function fetchAppleMusicAISearch(
  args: AppleMusicAISearchArgs
): Promise<AppleMusicAISearchResponse> {
  return await http<AppleMusicAISearchResponse>(
    "/api/ai/apple-music-search",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    }
  );
}

export type SpotifyTrackSearchArgs = {
  title?: string;
  artist?: string;
};

export type SpotifyTrackSearchItem = {
  id: string;
  title: string;
  artist: string;
  album: string;
  url: string;
  artwork: string;
  duration: number; // ms
};

export type SpotifyTrackSearchResponse = {
  results: SpotifyTrackSearchItem[];
  [k: string]: unknown;
};

export async function fetchSpotifyTrackSearch(
  args: SpotifyTrackSearchArgs
): Promise<SpotifyTrackSearchResponse> {
  // Use fetch directly to detect 401 and trigger OAuth redirect
  const res = await fetch("/api/ai/spotify-track-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href =
        "/api/spotify/login?state=" + encodeURIComponent(window.location.pathname);
    }
    // Return empty results after redirect trigger
    return { results: [] };
  }
  if (!res.ok) {
    throw new Error("Spotify search failed");
  }
  return (await res.json()) as SpotifyTrackSearchResponse;
}
