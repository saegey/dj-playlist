import { describe, it, expect } from "@jest/globals";
import {
  buildAudioVibeData,
  buildAudioVibeText,
  computeAudioVibeHash,
  hasAudioData,
} from "../audio-vibe-embedding";
import { Track } from "@/types/track";

describe("audio-vibe-embedding", () => {
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
    it("should return true if track has BPM", () => {
      expect(hasAudioData(mockTrack)).toBe(true);
    });

    it("should return true if track has key", () => {
      const track = { ...mockTrack, bpm: undefined, key: "C Major" };
      expect(hasAudioData(track as Track)).toBe(true);
    });

    it("should return true if track has danceability", () => {
      const track = { ...mockTrack, bpm: undefined, key: undefined, danceability: "0.5" };
      expect(hasAudioData(track as Track)).toBe(true);
    });

    it("should return true if track has any mood score", () => {
      const track = {
        ...mockTrack,
        bpm: undefined,
        key: undefined,
        danceability: undefined,
        mood_happy: 0.5,
      };
      expect(hasAudioData(track as Track)).toBe(true);
    });

    it("should return false if track has no audio data", () => {
      const track = {
        ...mockTrack,
        bpm: undefined,
        key: undefined,
        danceability: undefined,
        mood_happy: undefined,
        mood_sad: undefined,
        mood_relaxed: undefined,
        mood_aggressive: undefined,
      };
      expect(hasAudioData(track as Track)).toBe(false);
    });
  });

  describe("buildAudioVibeData", () => {
    it("should build audio vibe data from track", () => {
      const vibeData = buildAudioVibeData(mockTrack, false); // Don't include enhanced features

      expect(vibeData.bpm).toBe("128");
      expect(vibeData.bpmRange).toBe("upbeat");
      expect(vibeData.key).toBe("A Minor");
      expect(vibeData.camelot).toBe("8A");
      expect(vibeData.danceability).toBe("high");
      expect(vibeData.dominantMood).toBe("relaxed");
      expect(vibeData.vibeDescriptors).toContain("energetic");
    });

    it("should calculate energy correctly", () => {
      const vibeData = buildAudioVibeData(mockTrack, false);
      // energy = 0.75 * 0.6 + 0.1 * 0.4 = 0.45 + 0.04 = 0.49 (low)
      expect(vibeData.energy).toBe("low");
    });

    it("should handle unknown values gracefully", () => {
      const track = {
        ...mockTrack,
        bpm: undefined,
        key: undefined,
        danceability: undefined,
      };
      const vibeData = buildAudioVibeData(track as Track, false);

      expect(vibeData.bpm).toBe("unknown");
      expect(vibeData.key).toBe("unknown");
      expect(vibeData.danceability).toBe("unknown");
    });
  });

  describe("buildAudioVibeText", () => {
    it("should build deterministic text template", () => {
      const vibeData = buildAudioVibeData(mockTrack, false);
      const vibeText = buildAudioVibeText(vibeData);

      expect(vibeText).toContain("BPM: 128 (upbeat)");
      expect(vibeText).toContain("Key: A Minor - 8A");
      expect(vibeText).toContain("Danceability: high");
      expect(vibeText).toContain("Energy: low");
      expect(vibeText).toContain("Dominant Mood: relaxed");
      expect(vibeText).toContain("Vibe:");
    });

    it("should include enhanced features when available", () => {
      const vibeData = buildAudioVibeData(mockTrack, false);
      vibeData.acoustic = "balanced";
      vibeData.vocalPresence = "instrumental";
      vibeData.percussiveness = "rhythmic";
      vibeData.partyMood = "moderate";

      const vibeText = buildAudioVibeText(vibeData);

      expect(vibeText).toContain("Acoustic: balanced");
      expect(vibeText).toContain("Vocals: instrumental");
      expect(vibeText).toContain("Percussiveness: rhythmic");
      expect(vibeText).toContain("Party: moderate");
    });

    it("should omit enhanced features when not available", () => {
      const vibeData = buildAudioVibeData(mockTrack, false);
      const vibeText = buildAudioVibeText(vibeData);

      expect(vibeText).not.toContain("Acoustic:");
      expect(vibeText).not.toContain("Vocals:");
      expect(vibeText).not.toContain("Percussiveness:");
      expect(vibeText).not.toContain("Party:");
    });
  });

  describe("computeAudioVibeHash", () => {
    it("should compute consistent hash for same data", () => {
      const vibeData1 = buildAudioVibeData(mockTrack, false);
      const vibeData2 = buildAudioVibeData(mockTrack, false);

      const hash1 = computeAudioVibeHash(vibeData1);
      const hash2 = computeAudioVibeHash(vibeData2);

      expect(hash1).toBe(hash2);
    });

    it("should compute different hash for different data", () => {
      const track1 = mockTrack;
      const track2 = { ...mockTrack, bpm: "140" };

      const vibeData1 = buildAudioVibeData(track1, false);
      const vibeData2 = buildAudioVibeData(track2 as Track, false);

      const hash1 = computeAudioVibeHash(vibeData1);
      const hash2 = computeAudioVibeHash(vibeData2);

      expect(hash1).not.toBe(hash2);
    });

    it("should include enhanced features in hash", () => {
      const vibeData1 = buildAudioVibeData(mockTrack, false);
      const vibeData2 = { ...vibeData1, acoustic: "balanced" };

      const hash1 = computeAudioVibeHash(vibeData1);
      const hash2 = computeAudioVibeHash(vibeData2);

      expect(hash1).not.toBe(hash2);
    });

    it("should produce valid SHA256 hash", () => {
      const vibeData = buildAudioVibeData(mockTrack, false);
      const hash = computeAudioVibeHash(vibeData);

      // SHA256 hash is 64 hex characters
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("text template stability", () => {
    it("should produce identical text for identical tracks", () => {
      const text1 = buildAudioVibeText(buildAudioVibeData(mockTrack, false));
      const text2 = buildAudioVibeText(buildAudioVibeData(mockTrack, false));

      expect(text1).toBe(text2);
    });

    it("should handle all mood values in template", () => {
      const vibeData = buildAudioVibeData(mockTrack, false);
      const text = buildAudioVibeText(vibeData);

      expect(text).toContain("Mood Profile:");
      expect(text).toContain("Relaxed");
      expect(text).toContain("Happy");
      expect(text).toContain("Sad");
      expect(text).toContain("Aggressive");
    });
  });
});
