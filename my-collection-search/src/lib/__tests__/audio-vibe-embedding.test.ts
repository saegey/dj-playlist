import { describe, it, expect } from "vitest";
import {
  buildAudioVibeData,
  buildAudioVibeText,
  computeAudioVibeHash,
  hasAudioData,
} from "../audio-vibe-embedding";
import type { Track } from "@/types/track";

const mockTrack: Track = {
  id: 1,
  track_id: "test-123",
  friend_id: 1,
  title: "Test Track",
  artist: "Test Artist",
  album: "Test Album",
  year: "2020",
  duration: "3:45",
  position: 1,
  discogs_url: "https://discogs.com/test",
  apple_music_url: "",
  bpm: "128",
  key: "A Minor",
  danceability: "0.75",
  mood_happy: 0.3,
  mood_sad: 0.2,
  mood_relaxed: 0.7,
  mood_aggressive: 0.1,
};

describe("hasAudioData", () => {
  it("returns true when bpm is present", () => {
    expect(hasAudioData(mockTrack)).toBe(true);
  });

  it("returns true when only key is present", () => {
    expect(hasAudioData({ ...mockTrack, bpm: undefined, key: "C Major" } as Track)).toBe(true);
  });

  it("returns true when only danceability is present", () => {
    expect(
      hasAudioData({ ...mockTrack, bpm: undefined, key: undefined, danceability: "0.5" } as Track)
    ).toBe(true);
  });

  it("returns true when only mood is present", () => {
    expect(
      hasAudioData({
        ...mockTrack,
        bpm: undefined,
        key: undefined,
        danceability: undefined,
        mood_happy: 0.5,
      } as Track)
    ).toBe(true);
  });

  it("returns false when no audio fields are present", () => {
    expect(
      hasAudioData({
        ...mockTrack,
        bpm: undefined,
        key: undefined,
        danceability: undefined,
        mood_happy: undefined,
        mood_sad: undefined,
        mood_relaxed: undefined,
        mood_aggressive: undefined,
      } as Track)
    ).toBe(false);
  });
});

describe("buildAudioVibeData", () => {
  it("extracts and normalizes all fields from a full track", () => {
    const vibeData = buildAudioVibeData(mockTrack, false);
    expect(vibeData.bpm).toBe("128");
    expect(vibeData.bpmRange).toBe("upbeat");
    expect(vibeData.key).toBe("A Minor");
    expect(vibeData.camelot).toBe("8A");
    expect(vibeData.danceability).toBe("high");
    expect(vibeData.dominantMood).toBe("relaxed");
    expect(vibeData.vibeDescriptors).toContain("mellow");
    expect(vibeData.energy).toBe("moderate");
  });

  it("uses unknown for missing fields", () => {
    const unknown = buildAudioVibeData(
      { ...mockTrack, bpm: undefined, key: undefined, danceability: undefined } as Track,
      false
    );
    expect(unknown.bpm).toBe("unknown");
    expect(unknown.key).toBe("unknown");
    expect(unknown.danceability).toBe("unknown");
  });
});

describe("buildAudioVibeText", () => {
  it("includes all standard fields", () => {
    const vibeData = buildAudioVibeData(mockTrack, false);
    const vibeText = buildAudioVibeText(vibeData);
    expect(vibeText).toContain("BPM: 128 (upbeat)");
    expect(vibeText).toContain("Key: A Minor - 8A");
    expect(vibeText).toContain("Danceability: high");
    expect(vibeText).toContain("Energy: moderate");
    expect(vibeText).toContain("Dominant Mood: relaxed");
    expect(vibeText).toContain("Vibe:");
  });

  it("includes enhanced fields when present", () => {
    const vibeData = buildAudioVibeData(mockTrack, false);
    const enhanced = {
      ...vibeData,
      acoustic: "balanced",
      vocalPresence: "instrumental",
      percussiveness: "rhythmic",
      partyMood: "moderate",
    };
    const text = buildAudioVibeText(enhanced);
    expect(text).toContain("Acoustic: balanced");
    expect(text).toContain("Vocals: instrumental");
    expect(text).toContain("Percussiveness: rhythmic");
    expect(text).toContain("Party: moderate");
  });

  it("omits enhanced fields when absent", () => {
    const vibeData = buildAudioVibeData(mockTrack, false);
    const vibeText = buildAudioVibeText(vibeData);
    expect(vibeText).not.toContain("Acoustic:");
    expect(vibeText).not.toContain("Vocals:");
    expect(vibeText).not.toContain("Percussiveness:");
    expect(vibeText).not.toContain("Party:");
  });
});

describe("computeAudioVibeHash", () => {
  it("produces a stable SHA256 hash", () => {
    const vibeData1 = buildAudioVibeData(mockTrack, false);
    const vibeData2 = buildAudioVibeData(mockTrack, false);
    expect(computeAudioVibeHash(vibeData1)).toBe(computeAudioVibeHash(vibeData2));
    expect(computeAudioVibeHash(vibeData1)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes when source data changes", () => {
    const hash1 = computeAudioVibeHash(buildAudioVibeData(mockTrack, false));
    const hash2 = computeAudioVibeHash(buildAudioVibeData({ ...mockTrack, bpm: "140" } as Track, false));
    expect(hash1).not.toBe(hash2);
  });

  it("changes when enhanced features are added", () => {
    const vibeData = buildAudioVibeData(mockTrack, false);
    const hash1 = computeAudioVibeHash(vibeData);
    const hash2 = computeAudioVibeHash({ ...vibeData, acoustic: "balanced" });
    expect(hash1).not.toBe(hash2);
  });

  it("produces deterministic text with mood profile", () => {
    const text1 = buildAudioVibeText(buildAudioVibeData(mockTrack, false));
    const text2 = buildAudioVibeText(buildAudioVibeData(mockTrack, false));
    expect(text1).toBe(text2);
    expect(text1).toContain("Mood Profile:");
    expect(text1).toContain("Relaxed");
    expect(text1).toContain("Happy");
    expect(text1).toContain("Sad");
    expect(text1).toContain("Aggressive");
  });
});
