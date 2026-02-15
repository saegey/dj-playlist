/**
 * Tests for identity embedding functions
 * Run with: npx tsx src/lib/__tests__/identity-embedding.test.ts
 */

import {
  buildIdentityData,
  buildIdentityText,
  computeSourceHash,
} from "../identity-embedding";

// Simple test framework
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ ${message}`);
    failed++;
  }
}

function assertEquals(actual: any, expected: any, message: string) {
  const match = JSON.stringify(actual) === JSON.stringify(expected);
  assert(match, message);
  if (!match) {
    console.error(`  Expected: ${JSON.stringify(expected)}`);
    console.error(`  Actual:   ${JSON.stringify(actual)}`);
  }
}

console.log("\n=== Testing buildIdentityData ===");

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
};

const identityData = buildIdentityData(mockTrack as any);

assertEquals(identityData.title, "Test Track", "Title extracted");
assertEquals(identityData.artist, "Test Artist", "Artist extracted");
assertEquals(identityData.album, "Test Album", "Album extracted");
assertEquals(identityData.era, "1990s", "Era computed from year");
assertEquals(identityData.country, "us", "Country normalized");
assertEquals(
  identityData.labels,
  ["warp records", "ninja tune"],
  "Labels parsed and normalized"
);
assertEquals(
  identityData.genres,
  ["electronic"],
  "Uses album genres"
);
assertEquals(
  identityData.styles,
  ["ambient", "idm"],
  "Uses album styles"
);
assertEquals(
  identityData.tags,
  ["melodic", "euphoric"],
  "Filters DJ-function tags"
);

console.log("\n=== Testing buildIdentityText ===");

const identityText = buildIdentityText(identityData);
const expectedText = [
  "Track: Test Track — Test Artist",
  "Release: Test Album (1990s)",
  "Country: us",
  "Labels: warp records, ninja tune",
  "Genres: electronic",
  "Styles: ambient, idm",
  "Tags: melodic, euphoric",
].join("\n");

assertEquals(identityText, expectedText, "Identity text formatted correctly");

console.log("\n=== Testing computeSourceHash stability ===");

const hash1 = computeSourceHash(identityData);
const hash2 = computeSourceHash(identityData);

assertEquals(hash1, hash2, "Same data produces same hash");
assert(hash1.length === 64, "Hash is SHA256 (64 hex chars)");

// Test that different data produces different hash
const altData = { ...identityData, title: "Different Title" };
const hash3 = computeSourceHash(altData);
assert(hash1 !== hash3, "Different data produces different hash");

console.log("\n=== Testing identity text with missing fields ===");

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
};

const sparseData = buildIdentityData(sparseTrack as any);
const sparseText = buildIdentityText(sparseData);

const expectedSparseText = [
  "Track: Sparse Track — Sparse Artist",
  "Release: unknown (unknown-era)",
  "Country: unknown-country",
  "Labels: none",
  "Genres: unknown",
  "Styles: unknown",
  "Tags: none",
].join("\n");

assertEquals(
  sparseText,
  expectedSparseText,
  "Handles missing fields with defaults"
);

console.log("\n=== Summary ===");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
