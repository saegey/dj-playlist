/**
 * Tests for identity normalization functions
 * Run with: npx tsx src/lib/__tests__/identity-normalization.test.ts
 */

import {
  normalizeList,
  formatList,
  yearToEra,
  filterIdentityTags,
  normalizeCountry,
  normalizeLabels,
  combineGenres,
  normalizeStyles,
  normalizeLocalTags,
} from "../identity-normalization";

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

console.log("\n=== Testing normalizeList ===");
assertEquals(
  normalizeList(["House", "Techno", "house"]),
  ["house", "techno"],
  "Deduplicates and lowercases"
);
assertEquals(
  normalizeList("Drum & Bass"),
  ["drum bass"],
  "Handles string input and removes punctuation"
);
assertEquals(normalizeList(null), [], "Handles null");
assertEquals(normalizeList([]), [], "Handles empty array");
assertEquals(
  normalizeList(["  Ambient  ", "Dub  "]),
  ["ambient", "dub"],
  "Trims whitespace"
);

console.log("\n=== Testing formatList ===");
assertEquals(formatList(["house", "techno"]), "house, techno", "Formats list");
assertEquals(formatList([]), "", "Handles empty list");

console.log("\n=== Testing yearToEra ===");
assertEquals(yearToEra(2024), "2020s", "2024 -> 2020s");
assertEquals(yearToEra(2015), "2010s", "2015 -> 2010s");
assertEquals(yearToEra(2005), "2000s", "2005 -> 2000s");
assertEquals(yearToEra(1995), "1990s", "1995 -> 1990s");
assertEquals(yearToEra(1985), "1980s", "1985 -> 1980s");
assertEquals(yearToEra(1975), "1970s", "1975 -> 1970s");
assertEquals(yearToEra(1965), "1960s", "1965 -> 1960s");
assertEquals(yearToEra(1955), "1950s", "1955 -> 1950s");
assertEquals(yearToEra(1945), "pre-1950s", "1945 -> pre-1950s");
assertEquals(yearToEra(null), "unknown-era", "null -> unknown-era");
assertEquals(yearToEra("invalid"), "unknown-era", "invalid -> unknown-era");
assertEquals(yearToEra("1999"), "1990s", "String year 1999 -> 1990s");

console.log("\n=== Testing filterIdentityTags ===");
assertEquals(
  filterIdentityTags(["melodic", "peak", "warm-up", "euphoric"]),
  ["melodic", "euphoric"],
  "Filters out DJ-function tags"
);
assertEquals(
  filterIdentityTags(["banger", "opener", "closer"]),
  [],
  "Filters out all DJ-function tags"
);
assertEquals(
  filterIdentityTags(["techno", "ambient", "tool"]),
  ["techno", "ambient"],
  "Keeps genre tags, removes DJ tags"
);
assertEquals(
  filterIdentityTags(null),
  [],
  "Handles null"
);

console.log("\n=== Testing normalizeCountry ===");
assertEquals(normalizeCountry("US"), "us", "Normalizes country code");
assertEquals(
  normalizeCountry("United Kingdom"),
  "united kingdom",
  "Normalizes country name"
);
assertEquals(
  normalizeCountry(null),
  "unknown-country",
  "null -> unknown-country"
);

console.log("\n=== Testing normalizeLabels ===");
assertEquals(
  normalizeLabels(["Warp Records", "Ninja Tune", "XL Recordings", "Domino"]),
  ["warp records", "ninja tune", "xl recordings"],
  "Takes first 3 labels"
);
assertEquals(normalizeLabels([]), [], "Handles empty array");
assertEquals(normalizeLabels("Warp"), ["warp"], "Handles string input");

console.log("\n=== Testing combineGenres ===");
assertEquals(
  combineGenres(["Electronic", "House"], null, 8),
  ["electronic", "house"],
  "Uses Discogs genres"
);
assertEquals(
  combineGenres(null, "Rock", 8),
  ["rock"],
  "Falls back to Apple genre"
);
assertEquals(
  combineGenres(
    ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
    null,
    8
  ),
  ["a", "b", "c", "d", "e", "f", "g", "h"],
  "Limits to maxGenres"
);

console.log("\n=== Testing normalizeStyles ===");
assertEquals(
  normalizeStyles(["Deep House", "Tech House"], 12),
  ["deep house", "tech house"],
  "Normalizes styles"
);
// Test with unique styles to avoid deduplication
const manyStyles = Array.from({ length: 15 }, (_, i) => `style${i}`);
const expectedStyles = Array.from({ length: 12 }, (_, i) => `style${i}`);
assertEquals(
  normalizeStyles(manyStyles, 12),
  expectedStyles,
  "Limits to maxStyles"
);

console.log("\n=== Testing normalizeLocalTags ===");
assertEquals(
  normalizeLocalTags(["melodic", "peak-time", "euphoric", "banger"], 12),
  ["melodic", "euphoric"],
  "Filters DJ tags and normalizes"
);
assertEquals(
  normalizeLocalTags(
    ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13"],
    12
  ),
  ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12"],
  "Limits to maxTags"
);

console.log("\n=== Summary ===");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
