import { describe, it, expect } from "vitest";
import {
  buildMeiliSearchFilters,
  hasActiveFilters,
  getActiveFilterCount,
  createEmptyFilters,
} from "../trackFilters";

// Mirror of TracksFilter to avoid importing from a React component
type TracksFilter = {
  missingAudio?: boolean;
  missingAppleMusic?: boolean;
  missingYouTube?: boolean;
  missingSoundCloud?: boolean;
  missingAnyStreamingUrl?: boolean;
  missingMetadata?: boolean;
};

const empty: TracksFilter = {
  missingAudio: false,
  missingAppleMusic: false,
  missingYouTube: false,
  missingSoundCloud: false,
  missingAnyStreamingUrl: false,
  missingMetadata: false,
};

describe("buildMeiliSearchFilters", () => {
  it("returns empty array for no active filters", () => {
    expect(buildMeiliSearchFilters(empty)).toEqual([]);
  });

  it("adds local_audio_url IS NULL for missingAudio", () => {
    expect(buildMeiliSearchFilters({ ...empty, missingAudio: true })).toEqual([
      "local_audio_url IS NULL",
    ]);
  });

  it("adds bpm/key IS NULL for missingMetadata", () => {
    expect(buildMeiliSearchFilters({ ...empty, missingMetadata: true })).toEqual([
      "(bpm IS NULL OR key IS NULL)",
    ]);
  });

  it("adds all-streaming-urls filter for missingAnyStreamingUrl", () => {
    expect(buildMeiliSearchFilters({ ...empty, missingAnyStreamingUrl: true })).toEqual([
      "(apple_music_url IS NULL AND youtube_url IS NULL AND soundcloud_url IS NULL)",
    ]);
  });

  it("adds individual apple_music_url filter", () => {
    expect(buildMeiliSearchFilters({ ...empty, missingAppleMusic: true })).toEqual([
      "apple_music_url IS NULL",
    ]);
  });

  it("adds individual youtube_url filter", () => {
    expect(buildMeiliSearchFilters({ ...empty, missingYouTube: true })).toEqual([
      "youtube_url IS NULL",
    ]);
  });

  it("adds individual soundcloud_url filter", () => {
    expect(buildMeiliSearchFilters({ ...empty, missingSoundCloud: true })).toEqual([
      "soundcloud_url IS NULL",
    ]);
  });

  it("missingAnyStreamingUrl suppresses individual streaming filters", () => {
    const filters = buildMeiliSearchFilters({
      ...empty,
      missingAnyStreamingUrl: true,
      missingAppleMusic: true,
      missingYouTube: true,
    });
    expect(filters).toEqual([
      "(apple_music_url IS NULL AND youtube_url IS NULL AND soundcloud_url IS NULL)",
    ]);
    expect(filters).not.toContain("apple_music_url IS NULL");
  });

  it("combines multiple independent filters", () => {
    const filters = buildMeiliSearchFilters({
      ...empty,
      missingAudio: true,
      missingMetadata: true,
      missingAppleMusic: true,
    });
    expect(filters).toContain("local_audio_url IS NULL");
    expect(filters).toContain("(bpm IS NULL OR key IS NULL)");
    expect(filters).toContain("apple_music_url IS NULL");
    expect(filters).toHaveLength(3);
  });
});

describe("hasActiveFilters", () => {
  it("returns false for all-false filters", () => {
    expect(hasActiveFilters(empty)).toBe(false);
  });

  it("returns true when any filter is active", () => {
    expect(hasActiveFilters({ ...empty, missingAudio: true })).toBe(true);
    expect(hasActiveFilters({ ...empty, missingMetadata: true })).toBe(true);
    expect(hasActiveFilters({ ...empty, missingAnyStreamingUrl: true })).toBe(true);
  });
});

describe("getActiveFilterCount", () => {
  it("returns 0 for no active filters", () => {
    expect(getActiveFilterCount(empty)).toBe(0);
  });

  it("counts each active filter", () => {
    expect(getActiveFilterCount({ ...empty, missingAudio: true })).toBe(1);
    expect(getActiveFilterCount({ ...empty, missingAudio: true, missingMetadata: true })).toBe(2);
  });

  it("counts all 6 filters when all are active", () => {
    const all: TracksFilter = {
      missingAudio: true,
      missingAppleMusic: true,
      missingYouTube: true,
      missingSoundCloud: true,
      missingAnyStreamingUrl: true,
      missingMetadata: true,
    };
    expect(getActiveFilterCount(all)).toBe(6);
  });
});

describe("createEmptyFilters", () => {
  it("returns an object with all filters set to false", () => {
    const filters = createEmptyFilters();
    expect(Object.values(filters).every((v) => v === false)).toBe(true);
  });

  it("has all expected filter keys", () => {
    const filters = createEmptyFilters();
    expect(filters).toHaveProperty("missingAudio", false);
    expect(filters).toHaveProperty("missingAppleMusic", false);
    expect(filters).toHaveProperty("missingYouTube", false);
    expect(filters).toHaveProperty("missingSoundCloud", false);
    expect(filters).toHaveProperty("missingAnyStreamingUrl", false);
    expect(filters).toHaveProperty("missingMetadata", false);
  });
});
