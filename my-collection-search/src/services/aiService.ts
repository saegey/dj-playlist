import { http } from "./http";
import type { YoutubeVideo } from "@/types/track";

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
