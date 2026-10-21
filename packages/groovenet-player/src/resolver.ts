import type { GroovenetClient, Track } from "@groovenet/client";
import type { PlaybackSource } from "./types.js";

export interface ResolverConfig {
  apiBase: string;
  apiKey?: string;
}

/** Build the authenticated, range-capable app URL for a downloaded track. */
export function audioSource(track: Track, config: ResolverConfig): PlaybackSource | null {
  const filename = track.local_audio_url?.trim();
  if (!filename) return null;
  const base = config.apiBase.endsWith("/") ? config.apiBase : `${config.apiBase}/`;
  const url = new URL("audio", base);
  url.searchParams.set("filename", filename);
  return {
    url: url.toString(),
    ...(config.apiKey ? { headers: { Authorization: `Bearer ${config.apiKey}` } } : {}),
  };
}

export class TrackResolver {
  constructor(
    private readonly client: GroovenetClient,
    private readonly config: ResolverConfig
  ) {}

  async search(query: string, limit = 50): Promise<Track[]> {
    const result = await this.client.searchTracks({ query, limit });
    return result.tracks;
  }

  async playlist(playlistId: number | string): Promise<Track[]> {
    const { track_refs } = await this.client.getPlaylistTracks(playlistId);
    const refs = track_refs.slice().sort((a, b) => a.position - b.position);
    if (!refs.length) return [];
    const tracks = await this.client.batchGetTracks(refs);
    const byRef = new Map(tracks.map((track) => [`${track.friend_id}:${track.track_id}`, track]));
    return refs.flatMap((ref) => {
      const track = byRef.get(`${ref.friend_id}:${ref.track_id}`);
      return track ? [track] : [];
    });
  }

  source(track: Track): PlaybackSource | null {
    return audioSource(track, this.config);
  }
}
