// Centralized TanStack Query keys

import { AppleMusicAISearchArgs } from "@/services/aiService";

export const queryKeys = {
  playlists: () => ["playlists"] as const,
  friends: () => ["friends"] as const,
  backups: () => ["backups"] as const,
  playlistTrackIds: (playlistId: number | string) =>
    ["playlist", Number(playlistId), "track-ids"] as const,
  playlistTracks: (
    input:
      | readonly { track_id: string; friend_id: number; position?: number }[]
      | { tracks?: readonly { track_id: string; friend_id: number; position?: number }[] }
      | null
      | undefined
  ) => {
    type TrackRef = { track_id: string; friend_id: number; position?: number };
    const isTrackRef = (v: unknown): v is TrackRef =>
      !!v &&
      typeof v === "object" &&
      typeof (v as { track_id?: unknown }).track_id === "string" &&
      typeof (v as { friend_id?: unknown }).friend_id === "number";

    let arr: readonly TrackRef[] = [] as const;
    if (Array.isArray(input)) {
      arr = input.every(isTrackRef) ? input : ([] as const);
    } else if (input && typeof input === "object") {
      const maybeTracks = (input as { tracks?: unknown }).tracks;
      if (Array.isArray(maybeTracks) && maybeTracks.every(isTrackRef)) {
        arr = maybeTracks;
      }
    }
    return [
      "playlist-tracks",
      ...arr.map((t, i) => `${t.track_id}-${t.friend_id ?? 0}-${t.position ?? i}`),
    ] as const;
  },
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
