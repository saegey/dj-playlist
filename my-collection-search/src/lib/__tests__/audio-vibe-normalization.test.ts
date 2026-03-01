/**
 * Tests for audio-vibe-normalization
 * Run with: npx tsx src/lib/__tests__/audio-vibe-normalization.test.ts
 */

import {
  normalizeBpmRange,
  normalizeBpmValue,
  normalizeKey,
  getCamelotCode,
  normalizeDanceability,
  calculateEnergy,
  getDominantMood,
  getVibeDescriptors,
  formatMoodProfile,
  normalizeAcousticElectronic,
  normalizeVocalPresence,
  normalizePercussiveness,
  normalizePartyMood,
} from "../audio-vibe-normalization";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) passed++;
  else {
    failed++;
    console.error(`✗ ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  assert(ok, message);
  if (!ok) {
    console.error(`  expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
  }
}

function assertContains(haystack: string, needle: string, message: string) {
  assert(haystack.includes(needle), message);
}

function assertNotContains(haystack: string, needle: string, message: string) {
  assert(!haystack.includes(needle), message);
}

function run() {
  assertEqual(normalizeBpmRange(80), "very slow", "normalizeBpmRange: 80");
  assertEqual(normalizeBpmRange(100), "slow", "normalizeBpmRange: 100");
  assertEqual(normalizeBpmRange(120), "moderate", "normalizeBpmRange: 120");
  assertEqual(normalizeBpmRange(130), "upbeat", "normalizeBpmRange: 130");
  assertEqual(normalizeBpmRange(145), "fast", "normalizeBpmRange: 145");
  assertEqual(normalizeBpmRange(160), "very fast", "normalizeBpmRange: 160");
  assertEqual(normalizeBpmRange(180), "extremely fast", "normalizeBpmRange: 180");
  assertEqual(normalizeBpmRange("128"), "upbeat", "normalizeBpmRange: string");
  assertEqual(normalizeBpmRange(null), "unknown", "normalizeBpmRange: null");
  assertEqual(normalizeBpmRange(undefined), "unknown", "normalizeBpmRange: undefined");

  assertEqual(normalizeBpmValue(127.8), "128", "normalizeBpmValue: round number");
  assertEqual(normalizeBpmValue("127.3"), "127", "normalizeBpmValue: round string");
  assertEqual(normalizeBpmValue(null), "unknown", "normalizeBpmValue: null");
  assertEqual(normalizeBpmValue(undefined), "unknown", "normalizeBpmValue: undefined");

  assertEqual(normalizeKey("  C Major  "), "C Major", "normalizeKey: trim");
  assertEqual(normalizeKey("A Minor"), "A Minor", "normalizeKey: keep");
  assertEqual(normalizeKey(null), "unknown", "normalizeKey: null");
  assertEqual(normalizeKey(undefined), "unknown", "normalizeKey: undefined");

  assertEqual(getCamelotCode("C Major"), "8B", "getCamelotCode: C Major");
  assertEqual(getCamelotCode("A Minor"), "8A", "getCamelotCode: A Minor");
  assertEqual(getCamelotCode("D Major"), "10B", "getCamelotCode: D Major");
  assertEqual(getCamelotCode("B Minor"), "10A", "getCamelotCode: B Minor");
  assertEqual(getCamelotCode("Unknown Key"), "", "getCamelotCode: unknown");
  assertEqual(getCamelotCode(null), "", "getCamelotCode: null");

  assertEqual(normalizeDanceability(0.1), "very low", "normalizeDanceability: 0.1");
  assertEqual(normalizeDanceability(0.3), "low", "normalizeDanceability: 0.3");
  assertEqual(normalizeDanceability(0.5), "moderate", "normalizeDanceability: 0.5");
  assertEqual(normalizeDanceability(0.7), "high", "normalizeDanceability: 0.7");
  assertEqual(normalizeDanceability(0.9), "very high", "normalizeDanceability: 0.9");
  assertEqual(normalizeDanceability("0.75"), "high", "normalizeDanceability: string");
  assertEqual(normalizeDanceability(null), "unknown", "normalizeDanceability: null");
  assertEqual(normalizeDanceability(undefined), "unknown", "normalizeDanceability: undefined");

  assertEqual(calculateEnergy(0.8, 0.2), "moderate", "calculateEnergy: moderate");
  assertEqual(calculateEnergy(0.9, 0.9), "very high", "calculateEnergy: high");
  assertEqual(calculateEnergy(0.1, 0.1), "very low", "calculateEnergy: low");
  assertEqual(calculateEnergy(null, null), "very low", "calculateEnergy: nulls");
  assertEqual(calculateEnergy(0.5, null), "low", "calculateEnergy: partial");

  assertEqual(
    getDominantMood({ happy: 0.8, sad: 0.2, relaxed: 0.1, aggressive: 0.1 }),
    "happy",
    "getDominantMood: happy"
  );
  assertEqual(
    getDominantMood({ happy: 0.1, sad: 0.7, relaxed: 0.2, aggressive: 0.1 }),
    "sad",
    "getDominantMood: sad"
  );
  assertEqual(
    getDominantMood({ happy: 0.1, sad: 0.1, relaxed: 0.8, aggressive: 0.2 }),
    "relaxed",
    "getDominantMood: relaxed"
  );
  assertEqual(
    getDominantMood({ happy: 0.1, sad: 0.1, relaxed: 0.2, aggressive: 0.9 }),
    "aggressive",
    "getDominantMood: aggressive"
  );
  assertEqual(
    getDominantMood({ happy: 0.2, sad: 0.2, relaxed: 0.2, aggressive: 0.2 }),
    "neutral",
    "getDominantMood: neutral"
  );
  assertEqual(getDominantMood({}), "neutral", "getDominantMood: empty");

  const descriptors1 = getVibeDescriptors(95, "high", "happy");
  assert(descriptors1.includes("downtempo"), "getVibeDescriptors: downtempo");
  assert(descriptors1.includes("energetic"), "getVibeDescriptors: energetic");
  assert(descriptors1.includes("uplifting"), "getVibeDescriptors: uplifting");

  assertEqual(
    getVibeDescriptors(120, "moderate", "neutral"),
    ["balanced"],
    "getVibeDescriptors: balanced"
  );

  const descriptors2 = getVibeDescriptors(150, "very high", "aggressive");
  assert(descriptors2.includes("high-energy"), "getVibeDescriptors: high-energy");
  assert(descriptors2.includes("energetic"), "getVibeDescriptors: energetic 2");
  assert(descriptors2.includes("driving"), "getVibeDescriptors: driving");

  const profile = formatMoodProfile({
    happy: 0.75,
    sad: 0.25,
    relaxed: 0.5,
    aggressive: 0.1,
  });
  assertContains(profile, "Happy (0.75)", "formatMoodProfile: happy");
  assertContains(profile, "Sad (0.25)", "formatMoodProfile: sad");
  assertContains(profile, "Relaxed (0.50)", "formatMoodProfile: relaxed");
  assertContains(profile, "Aggressive (0.10)", "formatMoodProfile: aggressive");

  const profile2 = formatMoodProfile({
    happy: 0.8,
    sad: null,
    relaxed: undefined,
    aggressive: 0,
  });
  assertContains(profile2, "Happy (0.80)", "formatMoodProfile: happy only");
  assertNotContains(profile2, "Sad", "formatMoodProfile: omit sad");
  assertNotContains(profile2, "Relaxed", "formatMoodProfile: omit relaxed");
  assertNotContains(profile2, "Aggressive", "formatMoodProfile: omit aggressive zero");
  assertEqual(formatMoodProfile({}), "none", "formatMoodProfile: none");

  assertEqual(normalizeAcousticElectronic(0.9, 0.1), "very acoustic", "normalizeAcousticElectronic: very acoustic");
  assertEqual(normalizeAcousticElectronic(0.6, 0.3), "acoustic", "normalizeAcousticElectronic: acoustic");
  assertEqual(normalizeAcousticElectronic(0.5, 0.5), "balanced", "normalizeAcousticElectronic: balanced");
  assertEqual(normalizeAcousticElectronic(0.3, 0.6), "electronic", "normalizeAcousticElectronic: electronic");
  assertEqual(normalizeAcousticElectronic(0.1, 0.9), "very electronic", "normalizeAcousticElectronic: very electronic");
  assertEqual(normalizeAcousticElectronic(0.2, 0.2), "ambiguous", "normalizeAcousticElectronic: ambiguous");
  assertEqual(normalizeAcousticElectronic(undefined, undefined), "unknown", "normalizeAcousticElectronic: unknown");

  assertEqual(normalizeVocalPresence(0.9, 0.1), "instrumental", "normalizeVocalPresence: instrumental");
  assertEqual(normalizeVocalPresence(0.7, 0.25), "light vocals", "normalizeVocalPresence: light");
  assertEqual(normalizeVocalPresence(0.5, 0.5), "moderate vocals", "normalizeVocalPresence: moderate");
  assertEqual(normalizeVocalPresence(0.2, 0.8), "heavy vocals", "normalizeVocalPresence: heavy");
  assertEqual(normalizeVocalPresence(undefined, undefined), "unknown", "normalizeVocalPresence: unknown");

  assertEqual(normalizePercussiveness(1.5), "sparse", "normalizePercussiveness: sparse");
  assertEqual(normalizePercussiveness(3), "moderate", "normalizePercussiveness: moderate");
  assertEqual(normalizePercussiveness(5), "rhythmic", "normalizePercussiveness: rhythmic");
  assertEqual(normalizePercussiveness(8), "very rhythmic", "normalizePercussiveness: very rhythmic");
  assertEqual(normalizePercussiveness(undefined), "unknown", "normalizePercussiveness: unknown");

  assertEqual(normalizePartyMood(0.1), "low", "normalizePartyMood: low");
  assertEqual(normalizePartyMood(0.3), "moderate", "normalizePartyMood: moderate");
  assertEqual(normalizePartyMood(0.5), "high", "normalizePartyMood: high");
  assertEqual(normalizePartyMood(0.8), "very high", "normalizePartyMood: very high");
  assertEqual(normalizePartyMood(undefined), "unknown", "normalizePartyMood: unknown");

  console.log(`audio-vibe-normalization: passed=${passed} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

run();
