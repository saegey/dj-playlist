// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlaybackPersistence } from "@/providers/playlist-player/usePlaybackPersistence";
import type { Track } from "@/types/track";
import { useRef } from "react";

const KEY = "test-playback-state";

function makeTrack(id: string): Track {
  return {
    track_id: id,
    id: 1,
    title: `T${id}`,
    artist: "A",
    album: "B",
    year: "2020",
    duration: "3:00",
    duration_seconds: 180,
    position: "A1",
    discogs_url: "",
    apple_music_url: "",
    local_tags: "",
    bpm: null,
    key: null,
    notes: "",
    star_rating: 0,
    friend_id: 1,
    username: "alice",
  } as Track;
}

function makeArgs(overrides: Partial<Parameters<typeof usePlaybackPersistence>[0]> = {}) {
  return {
    storageKey: KEY,
    playlist: [],
    playlistRef: { current: [] },
    currentTrackIndex: null,
    isPlaying: false,
    volume: 0.8,
    currentTime: 0,
    plVersion: 0,
    pendingSeekRef: { current: null },
    audioRef: { current: null },
    setPlaylist: vi.fn(),
    setPlVersion: vi.fn(),
    setCurrentTrackIndex: vi.fn(),
    setIsPlaying: vi.fn(),
    setVolumeState: vi.fn(),
    ...overrides,
  } as Parameters<typeof usePlaybackPersistence>[0];
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

// ─── restore from localStorage on mount ──────────────────────────────────────

describe("restore on mount", () => {
  it("restores playlist when localStorage contains a valid playlist array", () => {
    const saved = [makeTrack("a"), makeTrack("b")];
    localStorage.setItem(KEY, JSON.stringify({ playlist: saved }));

    const args = makeArgs();
    renderHook(() => usePlaybackPersistence(args));

    expect(args.setPlaylist).toHaveBeenCalledWith(saved);
    expect(args.playlistRef.current).toEqual(saved);
    expect(args.setPlVersion).toHaveBeenCalled();
  });

  it("restores currentTrackIndex when present as a number", () => {
    localStorage.setItem(KEY, JSON.stringify({ currentTrackIndex: 2 }));

    const args = makeArgs();
    renderHook(() => usePlaybackPersistence(args));

    expect(args.setCurrentTrackIndex).toHaveBeenCalledWith(2);
  });

  it("restores currentTrackIndex when present as null", () => {
    localStorage.setItem(KEY, JSON.stringify({ currentTrackIndex: null }));

    const args = makeArgs();
    renderHook(() => usePlaybackPersistence(args));

    expect(args.setCurrentTrackIndex).toHaveBeenCalledWith(null);
  });

  it("restores isPlaying when present as a boolean", () => {
    localStorage.setItem(KEY, JSON.stringify({ isPlaying: true }));

    const args = makeArgs();
    renderHook(() => usePlaybackPersistence(args));

    expect(args.setIsPlaying).toHaveBeenCalledWith(true);
  });

  it("restores volume clamped to [0, 1]", () => {
    localStorage.setItem(KEY, JSON.stringify({ volume: 1.5 }));

    const args = makeArgs();
    renderHook(() => usePlaybackPersistence(args));

    expect(args.setVolumeState).toHaveBeenCalledWith(1);
  });

  it("clamps volume below 0 to 0", () => {
    localStorage.setItem(KEY, JSON.stringify({ volume: -0.5 }));

    const args = makeArgs();
    renderHook(() => usePlaybackPersistence(args));

    expect(args.setVolumeState).toHaveBeenCalledWith(0);
  });

  it("sets audio element volume when audioRef.current exists", () => {
    const audio = { volume: 0 } as HTMLAudioElement;
    localStorage.setItem(KEY, JSON.stringify({ volume: 0.6 }));

    const args = makeArgs({ audioRef: { current: audio } });
    renderHook(() => usePlaybackPersistence(args));

    expect(audio.volume).toBe(0.6);
  });

  it("sets pendingSeekRef when currentTime is a number", () => {
    localStorage.setItem(KEY, JSON.stringify({ currentTime: 42 }));

    const args = makeArgs();
    renderHook(() => usePlaybackPersistence(args));

    expect(args.pendingSeekRef.current).toBe(42);
  });

  it("does nothing when localStorage has no entry for the key", () => {
    const args = makeArgs();
    renderHook(() => usePlaybackPersistence(args));

    expect(args.setPlaylist).not.toHaveBeenCalled();
    expect(args.setCurrentTrackIndex).not.toHaveBeenCalled();
  });

  it("ignores corrupt JSON without throwing", () => {
    localStorage.setItem(KEY, "not-valid-json{{{");

    const args = makeArgs();
    expect(() => renderHook(() => usePlaybackPersistence(args))).not.toThrow();
  });

  it("ignores playlist when it is not an array", () => {
    localStorage.setItem(KEY, JSON.stringify({ playlist: "oops" }));

    const args = makeArgs();
    renderHook(() => usePlaybackPersistence(args));

    expect(args.setPlaylist).not.toHaveBeenCalled();
  });
});

// ─── persist on state change ──────────────────────────────────────────────────

describe("persist on state change", () => {
  it("writes state to localStorage when dependencies change", () => {
    const playlist = [makeTrack("a")];
    const args = makeArgs({
      playlist,
      currentTrackIndex: 0,
      isPlaying: true,
      volume: 0.5,
      currentTime: 10,
    });

    renderHook(() => usePlaybackPersistence(args));

    const saved = JSON.parse(localStorage.getItem(KEY)!);
    expect(saved.playlist).toEqual(playlist);
    expect(saved.currentTrackIndex).toBe(0);
    expect(saved.isPlaying).toBe(true);
    expect(saved.volume).toBe(0.5);
  });

  it("writes currentTime using the override when provided via time-based effect", () => {
    // The time-based effect fires when currentTime changes to a new integer second.
    const args = makeArgs({ currentTime: 5 });
    renderHook(() => usePlaybackPersistence(args));

    const saved = JSON.parse(localStorage.getItem(KEY)!);
    expect(saved.currentTime).toBe(5);
  });
});
