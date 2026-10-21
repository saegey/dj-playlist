import { describe, expect, it } from "vitest";
import type { PlaybackSnapshot } from "@groovenet/player";
import { formatPlayback, formatTime } from "./playerTuiView.js";

describe("player TUI state rendering", () => {
  it("shows current track metadata, progress, and transport state", () => {
    const snapshot = {
      status: "playing", position: 65, duration: 180, volume: 70, error: null,
      current: { id: "q1", track: { title: "Blue Train", artist: "John Coltrane", bpm: 132, key: "A minor" } }, queue: [],
    } as unknown as PlaybackSnapshot;
    expect(formatPlayback(snapshot)).toEqual([
      "John Coltrane — Blue Train",
      "132 BPM · A minor",
      expect.stringContaining("1:05 / 3:00 · playing · 70%"),
    ]);
  });

  it("handles an empty player and formats time safely", () => {
    expect(formatPlayback({ status: "stopped", current: null, queue: [], position: 0, duration: null, volume: 100, error: null })).toEqual([
      "Nothing playing", "", expect.stringContaining("0:00 / --:-- · stopped · 100%"),
    ]);
    expect(formatTime(-1)).toBe("0:00");
  });
});
