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
  SimilarIdentityResponse,
  SimilarVibeResponse,
  IdentitySimilarityQuery,
  SimilarityQuery,
  RecommendationCandidatesResponse,
  RecommendationCandidatesQuery,
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

  async getTrack(trackId: string, friendId: number): Promise<Track> {
    return this.request<Track>("GET", `/tracks/${trackId}`, undefined, { friend_id: friendId });
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

  async batchGetTracks(
    refs: { track_id: string; friend_id: number; position?: number }[]
  ): Promise<Track[]> {
    return this.request<Track[]>("POST", "/tracks/batch", { tracks: refs });
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
  ): Promise<{ track_refs: { track_id: string; friend_id: number; position?: number }[] }> {
    const result = await this.request<{
      playlist_id: number;
      playlist_name?: string | null;
      tracks: { track_id: string; friend_id?: number | null; position?: number }[];
    }>("GET", `/playlists/${playlistId}/tracks`);
    return {
      track_refs: result.tracks.map((t) => ({
        track_id: t.track_id,
        friend_id: t.friend_id ?? 1,
        position: t.position,
      })),
    };
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

  // ── Similarity / Recommendations ─────────────────────────────────────────────

  async findSimilarIdentity(
    trackId: string,
    friendId: number,
    opts?: IdentitySimilarityQuery
  ): Promise<SimilarIdentityResponse> {
    const params: Record<string, string | number> = {
      track_id: trackId,
      friend_id: friendId,
    };
    if (opts?.limit != null) params.limit = opts.limit;
    if (opts?.ivfflat_probes != null) params.ivfflat_probes = opts.ivfflat_probes;
    if (opts?.era) params.era = opts.era;
    if (opts?.country) params.country = opts.country;
    if (opts?.tags) params.tags = opts.tags;
    return this.request<SimilarIdentityResponse>(
      "GET",
      "/embeddings/similar",
      undefined,
      params
    );
  }

  async getRecommendationCandidates(
    trackId: string,
    friendId: number,
    opts?: RecommendationCandidatesQuery
  ): Promise<RecommendationCandidatesResponse> {
    const params: Record<string, string | number> = {
      track_id: trackId,
      friend_id: friendId,
    };
    if (opts?.limit_identity != null) params.limit_identity = opts.limit_identity;
    if (opts?.limit_audio != null) params.limit_audio = opts.limit_audio;
    if (opts?.ivfflat_probes != null) params.ivfflat_probes = opts.ivfflat_probes;
    return this.request<RecommendationCandidatesResponse>(
      "GET",
      "/recommendations/candidates",
      undefined,
      params
    );
  }

  async findSimilarVibe(
    trackId: string,
    friendId: number,
    opts?: SimilarityQuery
  ): Promise<SimilarVibeResponse> {
    const params: Record<string, string | number> = {
      track_id: trackId,
      friend_id: friendId,
    };
    if (opts?.limit != null) params.limit = opts.limit;
    if (opts?.ivfflat_probes != null) params.ivfflat_probes = opts.ivfflat_probes;
    return this.request<SimilarVibeResponse>(
      "GET",
      "/embeddings/similar-vibe",
      undefined,
      params
    );
  }
}
