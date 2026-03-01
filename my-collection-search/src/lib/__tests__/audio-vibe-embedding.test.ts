/**
 * Tests for audio-vibe-embedding
 * Run with: npx tsx src/lib/__tests__/audio-vibe-embedding.test.ts
 */

import {
  buildAudioVibeData,
  buildAudioVibeText,
  computeAudioVibeHash,
  hasAudioData,
} from "../audio-vibe-embedding";
import type { Track } from "@/types/track";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
  } else {
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

function assertMatches(value: string, re: RegExp, message: string) {
  assert(re.test(value), message);
}

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

function testHasAudioData() {
  assertEqual(hasAudioData(mockTrack), true, "hasAudioData: bpm present");
  assertEqual(
    hasAudioData({ ...mockTrack, bpm: undefined, key: "C Major" } as Track),
    true,
    "hasAudioData: key present"
  );
  assertEqual(
    hasAudioData({ ...mockTrack, bpm: undefined, key: undefined, danceability: "0.5" } as Track),
    true,
    "hasAudioData: danceability present"
  );
  assertEqual(
    hasAudioData({
      ...mockTrack,
      bpm: undefined,
      key: undefined,
      danceability: undefined,
      mood_happy: 0.5,
    } as Track),
    true,
    "hasAudioData: mood present"
  );
  assertEqual(
    hasAudioData({
      ...mockTrack,
      bpm: undefined,
      key: undefined,
      danceability: undefined,
      mood_happy: undefined,
      mood_sad: undefined,
      mood_relaxed: undefined,
      mood_aggressive: undefined,
    } as Track),
    false,
    "hasAudioData: no audio fields"
  );
}

function testBuildAudioVibeData() {
  const vibeData = buildAudioVibeData(mockTrack, false);
  assertEqual(vibeData.bpm, "128", "buildAudioVibeData: bpm");
  assertEqual(vibeData.bpmRange, "upbeat", "buildAudioVibeData: bpmRange");
  assertEqual(vibeData.key, "A Minor", "buildAudioVibeData: key");
  assertEqual(vibeData.camelot, "8A", "buildAudioVibeData: camelot");
  assertEqual(vibeData.danceability, "high", "buildAudioVibeData: danceability");
  assertEqual(vibeData.dominantMood, "relaxed", "buildAudioVibeData: dominantMood");
  assert(vibeData.vibeDescriptors.includes("mellow"), "buildAudioVibeData: includes mellow descriptor");
  assertEqual(vibeData.energy, "moderate", "buildAudioVibeData: energy");

  const unknown = buildAudioVibeData(
    { ...mockTrack, bpm: undefined, key: undefined, danceability: undefined } as Track,
    false
  );
  assertEqual(unknown.bpm, "unknown", "buildAudioVibeData: unknown bpm");
  assertEqual(unknown.key, "unknown", "buildAudioVibeData: unknown key");
  assertEqual(unknown.danceability, "unknown", "buildAudioVibeData: unknown danceability");
}

function testBuildAudioVibeText() {
  const vibeData = buildAudioVibeData(mockTrack, false);
  const vibeText = buildAudioVibeText(vibeData);
  assertContains(vibeText, "BPM: 128 (upbeat)", "buildAudioVibeText: bpm line");
  assertContains(vibeText, "Key: A Minor - 8A", "buildAudioVibeText: key line");
  assertContains(vibeText, "Danceability: high", "buildAudioVibeText: danceability line");
  assertContains(vibeText, "Energy: moderate", "buildAudioVibeText: energy line");
  assertContains(vibeText, "Dominant Mood: relaxed", "buildAudioVibeText: mood line");
  assertContains(vibeText, "Vibe:", "buildAudioVibeText: vibe line");

  const enhanced = { ...vibeData, acoustic: "balanced", vocalPresence: "instrumental", percussiveness: "rhythmic", partyMood: "moderate" };
  const enhancedText = buildAudioVibeText(enhanced);
  assertContains(enhancedText, "Acoustic: balanced", "buildAudioVibeText: enhanced acoustic");
  assertContains(enhancedText, "Vocals: instrumental", "buildAudioVibeText: enhanced vocals");
  assertContains(enhancedText, "Percussiveness: rhythmic", "buildAudioVibeText: enhanced percussiveness");
  assertContains(enhancedText, "Party: moderate", "buildAudioVibeText: enhanced party");

  assertNotContains(vibeText, "Acoustic:", "buildAudioVibeText: omit acoustic when absent");
  assertNotContains(vibeText, "Vocals:", "buildAudioVibeText: omit vocals when absent");
  assertNotContains(vibeText, "Percussiveness:", "buildAudioVibeText: omit percussiveness when absent");
  assertNotContains(vibeText, "Party:", "buildAudioVibeText: omit party when absent");
}

function testHashingAndStability() {
  const vibeData1 = buildAudioVibeData(mockTrack, false);
  const vibeData2 = buildAudioVibeData(mockTrack, false);
  const hash1 = computeAudioVibeHash(vibeData1);
  const hash2 = computeAudioVibeHash(vibeData2);
  assertEqual(hash1, hash2, "computeAudioVibeHash: stable for same data");

  const hash3 = computeAudioVibeHash(buildAudioVibeData({ ...mockTrack, bpm: "140" } as Track, false));
  assert(hash1 !== hash3, "computeAudioVibeHash: changes when source data changes");

  const hash4 = computeAudioVibeHash({ ...vibeData1, acoustic: "balanced" });
  assert(hash1 !== hash4, "computeAudioVibeHash: includes enhanced features");
  assertMatches(hash1, /^[a-f0-9]{64}$/, "computeAudioVibeHash: SHA256 format");

  const text1 = buildAudioVibeText(buildAudioVibeData(mockTrack, false));
  const text2 = buildAudioVibeText(buildAudioVibeData(mockTrack, false));
  assertEqual(text1, text2, "audio vibe text is deterministic");
  assertContains(text1, "Mood Profile:", "audio vibe text includes mood profile");
  assertContains(text1, "Relaxed", "audio vibe text includes relaxed mood");
  assertContains(text1, "Happy", "audio vibe text includes happy mood");
  assertContains(text1, "Sad", "audio vibe text includes sad mood");
  assertContains(text1, "Aggressive", "audio vibe text includes aggressive mood");
}

function run() {
  testHasAudioData();
  testBuildAudioVibeData();
  testBuildAudioVibeText();
  testHashingAndStability();

  console.log(`audio-vibe-embedding: passed=${passed} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

run();
