/**
 * Tests for RecommendationPreScorer
 *
 * Run with: npx tsx src/lib/__tests__/recommendation-pre-scorer.test.ts
 */

import {
  calculateBpmBonus,
  calculateKeyBonus,
  calculateTagBonus,
  calculateEraBonus,
  calculateEnergyPenalty,
  calculateCamelotDistance,
  calculateJaccardOverlap,
  areErasAdjacent,
  applyConstraintsAndBonuses,
  SeedTrack,
} from "../recommendation-pre-scorer";
import { CandidateTrack } from "../recommendation-candidate-retriever";

// Test utilities
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertAlmostEqual(actual: number, expected: number, tolerance: number, message: string) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}\n  Expected: ${expected} ± ${tolerance}\n  Actual: ${actual}`);
  }
}

/**
 * Test 1: BPM Bonus Step Function
 */
function testBpmBonusStepFunction() {
  console.log("\n🧪 Test 1: BPM Bonus Step Function");

  // Δ ≤ 1 => +0.06
  assertAlmostEqual(
    calculateBpmBonus(128, 128, 1.0),
    0.06,
    0.001,
    "Same BPM should give +0.06"
  );
  assertAlmostEqual(
    calculateBpmBonus(128, 129, 1.0),
    0.06,
    0.001,
    "Δ=1 should give +0.06"
  );

  // Δ ≤ 2 => +0.04
  assertAlmostEqual(
    calculateBpmBonus(128, 130, 1.0),
    0.04,
    0.001,
    "Δ=2 should give +0.04"
  );

  // Δ ≤ 4 => +0.02
  assertAlmostEqual(
    calculateBpmBonus(128, 132, 1.0),
    0.02,
    0.001,
    "Δ=4 should give +0.02"
  );
  assertAlmostEqual(
    calculateBpmBonus(128, 131, 1.0),
    0.02,
    0.001,
    "Δ=3 should give +0.02"
  );

  // Δ ≤ 6 => +0.01
  assertAlmostEqual(
    calculateBpmBonus(128, 134, 1.0),
    0.01,
    0.001,
    "Δ=6 should give +0.01"
  );

  // Δ > 8 => -0.03
  assertAlmostEqual(
    calculateBpmBonus(128, 137, 1.0),
    -0.03,
    0.001,
    "Δ=9 should give -0.03"
  );
  assertAlmostEqual(
    calculateBpmBonus(128, 140, 1.0),
    -0.03,
    0.001,
    "Δ=12 should give -0.03"
  );

  // Δ between 6 and 8 => 0 (no bonus, no penalty)
  assertAlmostEqual(
    calculateBpmBonus(128, 135, 1.0),
    0,
    0.001,
    "Δ=7 should give 0"
  );

  // Test tempo confidence scaling
  assertAlmostEqual(
    calculateBpmBonus(128, 128, 0.5),
    0.03,
    0.001,
    "0.5 tempo confidence should halve bonus"
  );

  // Null BPM should return 0
  assertAlmostEqual(
    calculateBpmBonus(null, 128, 1.0),
    0,
    0.001,
    "Null seed BPM should give 0"
  );
  assertAlmostEqual(
    calculateBpmBonus(128, null, 1.0),
    0,
    0.001,
    "Null candidate BPM should give 0"
  );

  console.log("  ✅ BPM bonus step function tests passed");
}

/**
 * Test 2: Camelot Compatibility Logic
 */
function testCamelotCompatibility() {
  console.log("\n🧪 Test 2: Camelot Compatibility Logic");

  // Same camelot code => distance 0
  assertAlmostEqual(
    calculateCamelotDistance("C Major", "C Major")!,
    0,
    0.001,
    "Same key should give distance 0"
  );

  // Relative major/minor (same position, different type) => distance 0.5
  assertAlmostEqual(
    calculateCamelotDistance("C Major", "A Minor")!,
    0.5,
    0.001,
    "Relative major/minor should give distance 0.5"
  );

  // Adjacent on wheel, same type => distance 1
  assertAlmostEqual(
    calculateCamelotDistance("C Major", "G Major")!,
    1,
    0.001,
    "Adjacent same type should give distance 1"
  );

  // Adjacent on wheel, different type => distance 1.5
  assertAlmostEqual(
    calculateCamelotDistance("C Major", "E Minor")!,
    1.5,
    0.001,
    "Adjacent different type should give distance 1.5"
  );

  // Wrap-around (12 -> 1)
  assertAlmostEqual(
    calculateCamelotDistance("E Major", "B Major")!,
    1,
    0.001,
    "Wrap-around should work correctly"
  );

  // Null keys should return null
  assert(
    calculateCamelotDistance(null, "C Major") === null,
    "Null seed key should return null"
  );
  assert(
    calculateCamelotDistance("C Major", null) === null,
    "Null candidate key should return null"
  );

  // Test key bonus
  // Same camelot => +0.06
  assertAlmostEqual(
    calculateKeyBonus("C Major", "C Major", 1.0),
    0.06,
    0.001,
    "Same key should give +0.06"
  );

  // Adjacent on wheel => +0.04
  assertAlmostEqual(
    calculateKeyBonus("C Major", "G Major", 1.0),
    0.04,
    0.001,
    "Adjacent key should give +0.04"
  );

  // Relative major/minor => +0.03
  assertAlmostEqual(
    calculateKeyBonus("C Major", "A Minor", 1.0),
    0.03,
    0.001,
    "Relative major/minor should give +0.03"
  );

  // Test key confidence scaling
  assertAlmostEqual(
    calculateKeyBonus("C Major", "C Major", 0.5),
    0.03,
    0.001,
    "0.5 key confidence should halve bonus"
  );

  console.log("  ✅ Camelot compatibility tests passed");
}

/**
 * Test 3: Jaccard Overlap
 */
function testJaccardOverlap() {
  console.log("\n🧪 Test 3: Jaccard Overlap");

  // Perfect overlap
  assertAlmostEqual(
    calculateJaccardOverlap(["a", "b", "c"], ["a", "b", "c"]),
    1.0,
    0.001,
    "Perfect overlap should give 1.0"
  );

  // No overlap
  assertAlmostEqual(
    calculateJaccardOverlap(["a", "b"], ["c", "d"]),
    0.0,
    0.001,
    "No overlap should give 0.0"
  );

  // Partial overlap
  // Intersection: {a, b}, Union: {a, b, c, d} => 2/4 = 0.5
  assertAlmostEqual(
    calculateJaccardOverlap(["a", "b", "c"], ["a", "b", "d"]),
    0.5,
    0.001,
    "Partial overlap should give correct ratio"
  );

  // Case insensitive
  assertAlmostEqual(
    calculateJaccardOverlap(["A", "B"], ["a", "b"]),
    1.0,
    0.001,
    "Should be case insensitive"
  );

  // Empty arrays
  assertAlmostEqual(
    calculateJaccardOverlap([], []),
    0.0,
    0.001,
    "Empty arrays should give 0.0"
  );

  // One empty
  assertAlmostEqual(
    calculateJaccardOverlap(["a"], []),
    0.0,
    0.001,
    "One empty array should give 0.0"
  );

  // Test tag bonus calculation
  // Tags: {house, techno}, Styles: {progressive} vs Tags: {house}, Styles: {progressive, trance}
  // Combined1: {house, techno, progressive}, Combined2: {house, progressive, trance}
  // Intersection: {house, progressive} = 2, Union: {house, techno, progressive, trance} = 4
  // Jaccard: 2/4 = 0.5, Bonus: 0.08 * 0.5 = 0.04
  assertAlmostEqual(
    calculateTagBonus(
      ["house", "techno"],
      ["progressive"],
      ["house"],
      ["progressive", "trance"]
    ),
    0.04,
    0.001,
    "Tag bonus should be 0.08 * jaccard overlap"
  );

  console.log("  ✅ Jaccard overlap tests passed");
}

/**
 * Test 4: Era Adjacency
 */
function testEraAdjacency() {
  console.log("\n🧪 Test 4: Era Adjacency");

  // Same era
  assert(areErasAdjacent("1990s", "1990s") === false, "Same era is not adjacent");

  // Adjacent eras
  assert(areErasAdjacent("1990s", "2000s") === true, "1990s and 2000s are adjacent");
  assert(areErasAdjacent("2000s", "1990s") === true, "2000s and 1990s are adjacent (reverse)");
  assert(areErasAdjacent("1980s", "1990s") === true, "1980s and 1990s are adjacent");

  // Non-adjacent eras
  assert(areErasAdjacent("1980s", "2000s") === false, "1980s and 2000s are not adjacent");
  assert(areErasAdjacent("1990s", "2010s") === false, "1990s and 2010s are not adjacent");

  // Edge cases
  assert(areErasAdjacent("pre-1950s", "1950s") === true, "pre-1950s and 1950s are adjacent");
  assert(areErasAdjacent("2010s", "2020s") === true, "2010s and 2020s are adjacent");

  // Null eras
  assert(areErasAdjacent(null, "1990s") === false, "Null era should return false");
  assert(areErasAdjacent("1990s", null) === false, "Null era should return false");

  // Invalid eras
  assert(areErasAdjacent("invalid", "1990s") === false, "Invalid era should return false");

  // Test era bonus
  assertAlmostEqual(
    calculateEraBonus("1990s", "1990s"),
    0.02,
    0.001,
    "Same era should give +0.02"
  );

  assertAlmostEqual(
    calculateEraBonus("1990s", "2000s"),
    0.01,
    0.001,
    "Adjacent era should give +0.01"
  );

  assertAlmostEqual(
    calculateEraBonus("1990s", "2010s"),
    0.0,
    0.001,
    "Non-adjacent era should give 0"
  );

  console.log("  ✅ Era adjacency tests passed");
}

/**
 * Test 5: Energy Penalty
 */
function testEnergyPenalty() {
  console.log("\n🧪 Test 5: Energy Penalty");

  // No penalty if delta <= 0.35
  assertAlmostEqual(
    calculateEnergyPenalty(0.5, 0.5),
    0,
    0.001,
    "Same energy should give 0 penalty"
  );

  assertAlmostEqual(
    calculateEnergyPenalty(0.5, 0.8),
    0,
    0.001,
    "Δ=0.3 should give 0 penalty"
  );

  assertAlmostEqual(
    calculateEnergyPenalty(0.5, 0.85),
    0,
    0.001,
    "Δ=0.35 should give 0 penalty"
  );

  // Penalty if delta > 0.35
  // Δ = 0.45, penalty = 0.06 * (0.45 - 0.35) = 0.06 * 0.1 = 0.006
  assertAlmostEqual(
    calculateEnergyPenalty(0.5, 0.95),
    0.006,
    0.001,
    "Δ=0.45 should give 0.06 * (0.45 - 0.35) = 0.006 penalty"
  );

  // Large delta
  // Δ = 0.8, penalty = 0.06 * (0.8 - 0.35) = 0.06 * 0.45 = 0.027
  assertAlmostEqual(
    calculateEnergyPenalty(0.2, 1.0),
    0.027,
    0.001,
    "Δ=0.8 should give 0.06 * 0.45 = 0.027 penalty"
  );

  // Null energy should give 0
  assertAlmostEqual(
    calculateEnergyPenalty(null, 0.5),
    0,
    0.001,
    "Null seed energy should give 0 penalty"
  );

  assertAlmostEqual(
    calculateEnergyPenalty(0.5, null),
    0,
    0.001,
    "Null candidate energy should give 0 penalty"
  );

  console.log("  ✅ Energy penalty tests passed");
}

/**
 * Test 6: Constraint Application - Strict Mode
 */
function testStrictModeConstraints() {
  console.log("\n🧪 Test 6: Strict Mode Constraints");

  const seed: SeedTrack = {
    bpm: 128,
    key: "C Major",
    eraBucket: "1990s",
    tags: ["house", "techno"],
    styles: ["progressive"],
    energy: 0.7,
    danceability: 0.8,
  };

  const goodCandidate: CandidateTrack = {
    trackId: "good-1",
    friendId: 1,
    simIdentity: 0.9,
    simAudio: 0.85,
    metadata: {
      bpm: 129, // Δ=1, passes
      key: "G Major", // Adjacent, passes
      keyConfidence: 1.0,
      tempoConfidence: 1.0,
      eraBucket: "1990s",
      tags: ["house"], // Has overlap
      styles: ["progressive"],
      energy: 0.75,
      danceability: 0.8,
      title: "Good Track",
      artist: "Artist",
      album: "Album",
      year: "1995",
      genres: ["Electronic"],
      starRating: 5,
      moodHappy: 0.5,
      moodSad: 0.2,
      moodRelaxed: 0.3,
      moodAggressive: 0.4,
    },
  };

  const badBpmCandidate: CandidateTrack = {
    ...goodCandidate,
    trackId: "bad-bpm",
    metadata: {
      ...goodCandidate.metadata,
      bpm: 133, // Δ=5, rejected
    },
  };

  const badKeyCandidate: CandidateTrack = {
    ...goodCandidate,
    trackId: "bad-key",
    metadata: {
      ...goodCandidate.metadata,
      key: "F# Major", // Distance > 1, rejected
    },
  };

  const badTagCandidate: CandidateTrack = {
    ...goodCandidate,
    trackId: "bad-tag",
    metadata: {
      ...goodCandidate.metadata,
      tags: [],
      styles: ["trance"], // No overlap, rejected
    },
  };

  const candidates = [goodCandidate, badBpmCandidate, badKeyCandidate, badTagCandidate];

  const scored = applyConstraintsAndBonuses(seed, candidates, "strict");

  // Should only keep good candidate
  assert(scored.length === 1, `Strict mode should keep 1 candidate, got ${scored.length}`);
  assert(scored[0].trackId === "good-1", "Should keep the good candidate");

  console.log("  ✅ Strict mode constraints tests passed");
}

/**
 * Test 7: Constraint Application - Mixable Mode
 */
function testMixableModeConstraints() {
  console.log("\n🧪 Test 7: Mixable Mode Constraints");

  const seed: SeedTrack = {
    bpm: 128,
    key: "C Major",
    eraBucket: "1990s",
    tags: [],
    styles: [],
    energy: 0.7,
    danceability: 0.8,
  };

  const goodCandidate: CandidateTrack = {
    trackId: "good-1",
    friendId: 1,
    simIdentity: 0.9,
    simAudio: 0.85,
    metadata: {
      bpm: 134, // Δ=6, passes mixable
      key: "D Major", // Distance = 2, passes mixable
      keyConfidence: 1.0,
      tempoConfidence: 1.0,
      eraBucket: "1990s",
      tags: [],
      styles: [],
      energy: 0.75,
      danceability: 0.8,
      title: "Good Track",
      artist: "Artist",
      album: "Album",
      year: "1995",
      genres: ["Electronic"],
      starRating: 5,
      moodHappy: 0.5,
      moodSad: 0.2,
      moodRelaxed: 0.3,
      moodAggressive: 0.4,
    },
  };

  const badBpmCandidate: CandidateTrack = {
    ...goodCandidate,
    trackId: "bad-bpm",
    metadata: {
      ...goodCandidate.metadata,
      bpm: 135, // Δ=7, rejected
    },
  };

  const candidates = [goodCandidate, badBpmCandidate];

  const scored = applyConstraintsAndBonuses(seed, candidates, "mixable");

  assert(scored.length === 1, `Mixable mode should keep 1 candidate, got ${scored.length}`);
  assert(scored[0].trackId === "good-1", "Should keep the good candidate");

  console.log("  ✅ Mixable mode constraints tests passed");
}

/**
 * Test 8: Constraint Application - Blend Mode
 */
function testBlendModeConstraints() {
  console.log("\n🧪 Test 8: Blend Mode Constraints");

  const seed: SeedTrack = {
    bpm: 128,
    key: "C Major",
    eraBucket: "1990s",
    tags: [],
    styles: [],
    energy: 0.7,
    danceability: 0.8,
  };

  const goodCandidate: CandidateTrack = {
    trackId: "good-1",
    friendId: 1,
    simIdentity: 0.9,
    simAudio: 0.85,
    metadata: {
      bpm: 140, // Δ=12, passes blend (at threshold)
      key: "F# Major", // Any distance passes blend
      keyConfidence: 1.0,
      tempoConfidence: 1.0,
      eraBucket: "2010s",
      tags: [],
      styles: [],
      energy: 0.5,
      danceability: 0.6,
      title: "Good Track",
      artist: "Artist",
      album: "Album",
      year: "2015",
      genres: ["Electronic"],
      starRating: 5,
      moodHappy: 0.5,
      moodSad: 0.2,
      moodRelaxed: 0.3,
      moodAggressive: 0.4,
    },
  };

  const badBpmCandidate: CandidateTrack = {
    ...goodCandidate,
    trackId: "bad-bpm",
    metadata: {
      ...goodCandidate.metadata,
      bpm: 141, // Δ=13, rejected
    },
  };

  const candidates = [goodCandidate, badBpmCandidate];

  const scored = applyConstraintsAndBonuses(seed, candidates, "blend");

  assert(scored.length === 1, `Blend mode should keep 1 candidate, got ${scored.length}`);
  assert(scored[0].trackId === "good-1", "Should keep the good candidate");

  console.log("  ✅ Blend mode constraints tests passed");
}

/**
 * Test 9: Bonuses Computation
 */
function testBonusesComputation() {
  console.log("\n🧪 Test 9: Bonuses Computation");

  const seed: SeedTrack = {
    bpm: 128,
    key: "C Major",
    eraBucket: "1990s",
    tags: ["house", "techno"],
    styles: ["progressive"],
    energy: 0.7,
    danceability: 0.8,
  };

  const candidate: CandidateTrack = {
    trackId: "test-1",
    friendId: 1,
    simIdentity: 0.9,
    simAudio: 0.85,
    metadata: {
      bpm: 128, // Perfect match
      key: "C Major", // Perfect match
      keyConfidence: 1.0,
      tempoConfidence: 1.0,
      eraBucket: "1990s", // Same era
      tags: ["house", "techno"],
      styles: ["progressive"],
      energy: 0.7, // Same energy
      danceability: 0.8,
      title: "Test Track",
      artist: "Artist",
      album: "Album",
      year: "1995",
      genres: ["Electronic"],
      starRating: 5,
      moodHappy: 0.5,
      moodSad: 0.2,
      moodRelaxed: 0.3,
      moodAggressive: 0.4,
    },
  };

  const scored = applyConstraintsAndBonuses(seed, [candidate], "blend");

  assert(scored.length === 1, "Should score 1 candidate");

  const bonuses = scored[0].bonuses;
  const penalties = scored[0].penalties;

  assertAlmostEqual(bonuses.bpmBonus, 0.06, 0.001, "Perfect BPM match should give +0.06");
  assertAlmostEqual(bonuses.keyBonus, 0.06, 0.001, "Perfect key match should give +0.06");
  assertAlmostEqual(bonuses.eraBonus, 0.02, 0.001, "Same era should give +0.02");
  assertAlmostEqual(bonuses.tagBonus, 0.08, 0.001, "Perfect tag match should give +0.08");
  assertAlmostEqual(penalties.energyPenalty, 0, 0.001, "Same energy should give 0 penalty");

  console.log("  ✅ Bonuses computation tests passed");
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("=".repeat(60));
  console.log("🧪 Recommendation PreScorer Tests");
  console.log("=".repeat(60));

  const tests = [
    { name: "BPM Bonus Step Function", fn: testBpmBonusStepFunction },
    { name: "Camelot Compatibility", fn: testCamelotCompatibility },
    { name: "Jaccard Overlap", fn: testJaccardOverlap },
    { name: "Era Adjacency", fn: testEraAdjacency },
    { name: "Energy Penalty", fn: testEnergyPenalty },
    { name: "Strict Mode Constraints", fn: testStrictModeConstraints },
    { name: "Mixable Mode Constraints", fn: testMixableModeConstraints },
    { name: "Blend Mode Constraints", fn: testBlendModeConstraints },
    { name: "Bonuses Computation", fn: testBonusesComputation },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      test.fn();
      passed++;
    } catch (error) {
      failed++;
      console.error(`\n❌ ${test.name} FAILED:`, error);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});
