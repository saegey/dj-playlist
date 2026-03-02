import axios, { type AxiosInstance } from "axios";
import type {
  Track,
  Playlist,
  Friend,
  Album,
  AlbumSearchQuery,
  AlbumSearchResponse,
  AlbumDetail,
  AlbumUpdate,
  AlbumDownloadResult,
  TrackSearchQuery,
  TrackSearchResponse,
  TrackUpdate,
  PlaybackStatus,
} from "./types.js";

export interface GroovenetClientConfig {
  baseUrl: string;
  apiKey?: string;
}

export class GroovenetClient {
  private http: AxiosInstance;

  constructor(config: GroovenetClientConfig) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey
          ? { Authorization: `Bearer ${config.apiKey}` }
          : {}),
      },
    });
  }

  private async request<T>(
    method: string,
    path: string,
    data?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    try {
      const res = await this.http.request<T>({ method, url: path, data, params });
      return res.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg =
          (error.response?.data as Record<string, string>)?.error ||
          (error.response?.data as Record<string, string>)?.message ||
          error.message;
        throw new Error(`API Error: ${msg}`);
      }
      throw error;
    }
  }

  // ── Tracks ─────────────────────────────────────────────────────────────────

  async searchTracks(query: TrackSearchQuery): Promise<TrackSearchResponse> {
    return this.request<TrackSearchResponse>("POST", "/tracks/search", {
      query: query.query ?? "",
      limit: query.limit ?? 10,
      offset: query.offset ?? 0,
      filters:
        query.filters && Object.keys(query.filters).length > 0
          ? query.filters
          : undefined,
    });
  }

  async getTrack(trackId: string, username?: string): Promise<Track> {
    const params: Record<string, string> = {};
    if (username) params.username = username;
    return this.request<Track>("GET", `/tracks/${trackId}`, undefined, params);
  }

  async updateTrack(trackId: string, updates: TrackUpdate): Promise<Track> {
    return this.request<Track>("PATCH", "/tracks/update", {
      track_id: trackId,
      ...updates,
    });
  }

  async getMissingAppleMusic(
    page = 1,
    pageSize = 50,
    username?: string
  ): Promise<{ tracks: Track[]; total: number }> {
    const params: Record<string, string | number> = { page, pageSize };
    if (username) params.username = username;
    return this.request<{ tracks: Track[]; total: number }>(
      "GET",
      "/tracks/missing-apple-music",
      undefined,
      params
    );
  }

  async batchGetTracks(trackIds: string[]): Promise<Track[]> {
    return this.request<Track[]>("POST", "/tracks/batch", {
      track_ids: trackIds,
    });
  }

  // ── Albums ──────────────────────────────────────────────────────────────────

  async searchAlbums(query: AlbumSearchQuery = {}): Promise<AlbumSearchResponse> {
    const params: Record<string, string | number> = {
      q: query.q ?? "",
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
      sort: query.sort ?? "date_added:desc",
    };
    if (query.friend_id != null) params.friend_id = query.friend_id;
    return this.request<AlbumSearchResponse>("GET", "/albums", undefined, params);
  }

  async getAlbum(releaseId: string, friendId: number): Promise<AlbumDetail> {
    return this.request<AlbumDetail>(
      "GET",
      `/albums/${releaseId}`,
      undefined,
      { friend_id: friendId }
    );
  }

  async updateAlbum(
    releaseId: string,
    friendId: number,
    updates: AlbumUpdate
  ): Promise<{ success: boolean; album: Album; tracksUpdated?: number }> {
    return this.request("PATCH", "/albums/update", {
      release_id: releaseId,
      friend_id: friendId,
      ...updates,
    });
  }

  async downloadAlbum(releaseId: string, friendId: number): Promise<AlbumDownloadResult> {
    return this.request<AlbumDownloadResult>(
      "POST",
      `/albums/${releaseId}/download`,
      undefined,
      { friend_id: friendId }
    );
  }

  // ── Playlists ───────────────────────────────────────────────────────────────

  async listPlaylists(): Promise<Playlist[]> {
    return this.request<Playlist[]>("GET", "/playlists");
  }

  async getPlaylistTracks(
    playlistId: number | string
  ): Promise<{ track_ids: string[] }> {
    return this.request<{ track_ids: string[] }>(
      "GET",
      `/playlists/${playlistId}/tracks`
    );
  }

  async createPlaylist(name: string, tracks: string[] = []): Promise<Playlist> {
    return this.request<Playlist>("POST", "/playlists", { name, tracks });
  }

  async generatePlaylist(tracks: Track[]): Promise<Track[]> {
    const result = await this.request<{ result: Track[] | Record<string, Track> }>(
      "POST",
      "/playlists/genetic",
      { playlist: tracks }
    );
    const raw = result.result;
    if (Array.isArray(raw)) return raw;
    return Object.values(raw);
  }

  // ── Playback (proxied via Next.js API → MPD) ────────────────────────────────

  async play(filename: string): Promise<void> {
    await this.request("POST", "/playback/local", {
      action: "play",
      filename,
    });
  }

  async pause(): Promise<void> {
    await this.request("POST", "/playback/local", { action: "pause" });
  }

  async resume(): Promise<void> {
    await this.request("POST", "/playback/local", { action: "resume" });
  }

  async stop(): Promise<void> {
    await this.request("POST", "/playback/local", { action: "stop" });
  }

  async getPlaybackStatus(): Promise<PlaybackStatus> {
    return this.request<PlaybackStatus>("GET", "/playback/local");
  }

  // ── Friends ─────────────────────────────────────────────────────────────────

  async getFriends(): Promise<Friend[]> {
    const result = await this.request<{ friends?: string[]; results?: Friend[] }>(
      "GET",
      "/friends"
    );
    if (result.results) return result.results;
    if (result.friends) {
      return result.friends.map((username, i) => ({ id: i + 1, username }));
    }
    return [];
  }

  async addFriend(username: string): Promise<void> {
    await this.request("POST", "/friends", { username });
  }

  // ── External search helpers (delegate to Next.js AI routes) ─────────────────

  async searchAppleMusic(opts: {
    title?: string;
    artist?: string;
    album?: string;
    isrc?: string;
  }): Promise<{ results: unknown[] }> {
    return this.request<{ results: unknown[] }>(
      "POST",
      "/ai/apple-music-search",
      opts
    );
  }

  async searchYoutube(opts: {
    title?: string;
    artist?: string;
  }): Promise<{ results: unknown[] }> {
    return this.request<{ results: unknown[] }>(
      "POST",
      "/ai/youtube-music-search",
      opts
    );
  }
}
