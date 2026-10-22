import { describe, expect, it, vi } from "vitest";
import type { GroovenetClient, Track } from "@groovenet/client";
import { audioSource, TrackResolver } from "./resolver.js";

const track = (track_id: string, local_audio_url?: string) => ({
  track_id,
  friend_id: 1,
  title: track_id,
  local_audio_url,
}) as unknown as Track;

describe("audioSource", () => {
  it("resolves downloaded audio against the configured API base and carries auth", () => {
    expect(audioSource(track("song", "dj set/favorite #1.m4a"), {
      apiBase: "https://groovenet.test/api/",
      apiKey: "secret",
    })).toEqual({
      url: "https://groovenet.test/api/audio?filename=dj+set%2Ffavorite+%231.m4a",
      headers: { Authorization: "Bearer secret" },
    });
  });

  it("omits auth when no API key is configured and returns null for missing audio", () => {
    expect(audioSource(track("song", "/audio/song.mp3"), { apiBase: "http://host/api" }))
      .toEqual({ url: "http://host/api/audio?filename=%2Faudio%2Fsong.mp3" });
    expect(audioSource(track("missing"), { apiBase: "http://host/api" })).toBeNull();
  });
});

describe("TrackResolver", () => {
  it("delegates search and restores playlist order after batch resolution", async () => {
    const tracks = [track("first", "first.mp3"), track("second", "second.mp3")];
    const client = {
      searchTracks: vi.fn(async () => ({ tracks, estimatedTotalHits: 2, offset: 0, limit: 50, processingTimeMs: 1 })),
      getPlaylistTracks: vi.fn(async () => ({ track_refs: [
        { track_id: "second", friend_id: 1, position: 1 },
        { track_id: "first", friend_id: 1, position: 0 },
      ] })),
      batchGetTracks: vi.fn(async () => tracks.slice().reverse()),
    } as unknown as GroovenetClient;
    const resolver = new TrackResolver(client, { apiBase: "http://host/api" });

    expect(await resolver.search("cumbia", 12)).toEqual(tracks);
    expect(client.searchTracks).toHaveBeenCalledWith({ query: "cumbia", limit: 12 });
    expect((await resolver.playlist(42)).map(({ track_id }) => track_id)).toEqual(["first", "second"]);
    expect(client.batchGetTracks).toHaveBeenCalledWith([
      { track_id: "first", friend_id: 1, position: 0 },
      { track_id: "second", friend_id: 1, position: 1 },
    ]);
  });

  it("keeps API order when playlist refs have no positions", async () => {
    const tracks = [track("a", "a.mp3"), track("b", "b.mp3")];
    const client = {
      getPlaylistTracks: vi.fn(async () => ({ track_refs: [
        { track_id: "a", friend_id: 1 },
        { track_id: "b", friend_id: 1 },
      ] })),
      batchGetTracks: vi.fn(async () => tracks),
    } as unknown as GroovenetClient;
    const resolver = new TrackResolver(client, { apiBase: "http://host/api" });
    expect((await resolver.playlist(1)).map(({ track_id }) => track_id)).toEqual(["a", "b"]);
  });

  it("returns an empty playlist without making a batch request", async () => {
    const client = {
      getPlaylistTracks: vi.fn(async () => ({ track_refs: [] })),
      batchGetTracks: vi.fn(),
    } as unknown as GroovenetClient;
    const resolver = new TrackResolver(client, { apiBase: "http://host/api" });
    expect(await resolver.playlist(1)).toEqual([]);
    expect(client.batchGetTracks).not.toHaveBeenCalled();
  });

  it("drops unresolved playlist references", async () => {
    const client = {
      getPlaylistTracks: vi.fn(async () => ({ track_refs: [
        { track_id: "available", friend_id: 1, position: 0 },
        { track_id: "missing", friend_id: 2, position: 1 },
      ] })),
      batchGetTracks: vi.fn(async () => [track("available", "available.mp3")]),
    } as unknown as GroovenetClient;
    const resolver = new TrackResolver(client, { apiBase: "http://host/api" });
    expect((await resolver.playlist(1)).map(({ track_id }) => track_id)).toEqual(["available"]);
  });
});
