// Centralized TanStack Query keys

import { AppleMusicAISearchArgs } from "@/services/aiService";

export const queryKeys = {
  playlists: () => ["playlists"] as const,
  friends: () => ["friends"] as const,
  backups: () => ["backups"] as const,
  playlistTrackIds: (playlistId: number | string) =>
    ["playlist", Number(playlistId), "track-ids"] as const,
  playlistTracks: (ids: readonly string[]) =>
    ["playlist-tracks", ...ids] as const,
  tracks: (args: {
    q?: string;
    filter?: unknown;
    limit?: number;
    mode?: string;
    page?: number;
  }) => ["tracks", args] as const,
  // Root key helpers for prefix matching (invalidate/setQueriesData with exact:false)
  tracksRoot: () => ["tracks"] as const,
  playlistCounts: (ids: readonly string[]) => ["playlistCounts", ids] as const,
  // Mutation keys (optional centralization)
  tracksStatus: () => ["tracks", "status"] as const,
  appleAISearchKey(args: AppleMusicAISearchArgs) {
    return [
      "ai",
      "apple-music-search",
      args.title ?? "",
      args.artist ?? "",
    ] as const;
  },
  spotifySearchKey(args: { title?: string; artist?: string }) {
    return [
      "ai",
      "spotify-track-search",
      args.title ?? "",
      args.artist ?? "",
    ] as const;
  },
};
