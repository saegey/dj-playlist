import { describe, it, expect } from "vitest";
import {
  buildIdentityData,
  buildIdentityText,
  computeSourceHash,
} from "../identity-embedding";
import type { Track } from "@/types/track";

const mockTrack = {
  id: 1,
  track_id: "test-123",
  friend_id: 1,
  title: "Test Track",
  artist: "Test Artist",
  album: "Test Album",
  year: 1999,
  styles: ["Deep House", "Tech House"],
  genres: ["Electronic", "House"],
  duration: "5:30",
  position: 1,
  discogs_url: "http://discogs.com/test",
  apple_music_url: "http://apple.com/test",
  local_tags: "melodic, peak-time, euphoric",
  album_country: "US",
  album_label: "Warp Records, Ninja Tune",
  album_genres: ["Electronic"],
  album_styles: ["Ambient", "IDM"],
} as unknown as Track;

describe("buildIdentityData", () => {
  const identityData = buildIdentityData(mockTrack);

  it("extracts title and artist", () => {
    expect(identityData.title).toBe("Test Track");
    expect(identityData.artist).toBe("Test Artist");
    expect(identityData.album).toBe("Test Album");
  });

  it("computes era from year", () => {
    expect(identityData.era).toBe("1990s");
  });

  it("normalizes country", () => {
    expect(identityData.country).toBe("us");
  });

  it("parses and normalizes labels", () => {
    expect(identityData.labels).toEqual(["warp records", "ninja tune"]);
  });

  it("uses album genres", () => {
    expect(identityData.genres).toEqual(["electronic"]);
  });

  it("uses album styles", () => {
    expect(identityData.styles).toEqual(["ambient", "idm"]);
  });

  it("filters out DJ-function tags", () => {
    expect(identityData.tags).toEqual(["melodic", "euphoric"]);
  });
});

describe("buildIdentityText", () => {
  it("formats identity data into expected text", () => {
    const identityData = buildIdentityData(mockTrack);
    const expected = [
      "Track: Test Track — Test Artist",
      "Release: Test Album (1990s)",
      "Country: us",
      "Labels: warp records, ninja tune",
      "Genres: electronic",
      "Styles: ambient, idm",
      "Tags: melodic, euphoric",
    ].join("\n");
    expect(buildIdentityText(identityData)).toBe(expected);
  });

  it("handles missing fields with defaults", () => {
    const sparseTrack = {
      id: 2,
      track_id: "test-456",
      friend_id: 1,
      title: "Sparse Track",
      artist: "Sparse Artist",
      album: "",
      year: null,
      styles: null,
      genres: null,
      duration: "3:00",
      position: 1,
      discogs_url: "",
      apple_music_url: "",
      local_tags: null,
    } as unknown as Track;

    const sparseData = buildIdentityData(sparseTrack);
    const expected = [
      "Track: Sparse Track — Sparse Artist",
      "Release: unknown (unknown-era)",
      "Country: unknown-country",
      "Labels: none",
      "Genres: unknown",
      "Styles: unknown",
      "Tags: none",
    ].join("\n");
    expect(buildIdentityText(sparseData)).toBe(expected);
  });
});

describe("computeSourceHash", () => {
  it("produces a stable SHA256 hash", () => {
    const identityData = buildIdentityData(mockTrack);
    const hash1 = computeSourceHash(identityData);
    const hash2 = computeSourceHash(identityData);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("produces a different hash for different data", () => {
    const identityData = buildIdentityData(mockTrack);
    const hash1 = computeSourceHash(identityData);
    const hash2 = computeSourceHash({ ...identityData, title: "Different Title" });
    expect(hash1).not.toBe(hash2);
  });
});
