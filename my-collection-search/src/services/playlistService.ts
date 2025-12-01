// src/services/playlistService.ts
export type PlaylistTrackPayload = {
  track_id: string;
  friend_id?: number;
  username?: string;
  title?: string;
  artist?: string;
  album?: string;
  year?: string | number;
  styles?: string[];
  genres?: string[];
  duration?: string;
  duration_seconds?: number;
  position?: number;
  discogs_url?: string;
  apple_music_url?: string | null;
  youtube_url?: string | null;
  spotify_url?: string | null;
  soundcloud_url?: string | null;
  album_thumbnail?: string | null;
  local_tags?: string | null;
  bpm?: number | string | null;
  key?: string | null;
  danceability?: number | null;
  notes?: string | null;
  star_rating?: number | null;
  release_id?: string | null;
  mood_happy?: number | null;
  mood_sad?: number | null;
  mood_relaxed?: number | null;
  mood_aggressive?: number | null;
};

export async function importPlaylist(
  name: string,
  tracks: string[] | PlaylistTrackPayload[],
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

export type PlaylistTrackIdsResponse = {
  playlist_id: number;
  playlist_name?: string | null;
  tracks: { track_id: string; friend_id: number; position: number }[];
};

export async function fetchPlaylistTrackIds(
  id: number
): Promise<PlaylistTrackIdsResponse> {
  const res = await fetch(`/api/playlists/${id}/tracks`);
  if (!res.ok) throw new Error("Failed to fetch playlist tracks");
  const data = await res.json();
  console.log("Fetched playlist track ids:", data);
  return data as PlaylistTrackIdsResponse;
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
  data: { name?: string; tracks?: PlaylistTrackPayload[] }
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
