/**
 * Tests for RecommendationCandidateRetriever
 *
 * Run with: npx tsx src/lib/__tests__/recommendation-candidate-retriever.test.ts
 */

import { retrieveCandidates, hasEmbeddings } from "../recommendation-candidate-retriever";

// Test utilities
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

// Mock test data
// In a real test, you'd need actual track IDs with embeddings in your database
// For now, these are placeholders - replace with real IDs from your DB

/**
 * Test 1: Union deduplication
 *
 * Ensures that tracks appearing in both identity and audio results
 * are deduplicated and have both similarity scores populated.
 */
async function testUnionDeduplication() {
  console.log("\n🧪 Test 1: Union Deduplication");

  // This test requires a track that appears in both identity and audio results
  // You'll need to replace with an actual track_id from your database
  const SEED_TRACK_ID = "test-track-1"; // Replace with real track ID
  const SEED_FRIEND_ID = 1;

  try {
    const result = await retrieveCandidates(SEED_TRACK_ID, SEED_FRIEND_ID, {
      limitIdentity: 50,
      limitAudio: 50,
    });

    console.log(`  📊 Stats:`);
    console.log(`    - Identity results: ${result.stats.identityCount}`);
    console.log(`    - Audio results: ${result.stats.audioCount}`);
    console.log(`    - Union size: ${result.stats.unionCount}`);

    // Check that union size is <= identity + audio (due to deduplication)
    assert(
      result.stats.unionCount <= result.stats.identityCount + result.stats.audioCount,
      "Union size should be <= sum of individual results"
    );

    // Check that tracks with both similarities exist
    const tracksWithBoth = result.candidates.filter(
      c => c.simIdentity !== null && c.simAudio !== null
    );
    console.log(`    - Tracks with both similarities: ${tracksWithBoth.length}`);

    // Verify no duplicate track IDs
    const trackKeys = new Set<string>();
    for (const candidate of result.candidates) {
      const key = `${candidate.trackId}:${candidate.friendId}`;
      assert(
        !trackKeys.has(key),
        `Duplicate track found: ${key}`
      );
      trackKeys.add(key);
    }

    console.log("  ✅ Deduplication test passed");
  } catch (error) {
    console.error("  ❌ Test failed:", error);
    throw error;
  }
}

/**
 * Test 2: Missing embedding handling
 *
 * Ensures that the retriever gracefully handles cases where
 * a seed track has only one type of embedding.
 */
async function testMissingEmbedding() {
  console.log("\n🧪 Test 2: Missing Embedding Handling");

  // You'll need a track that has only identity OR only audio embedding
  const SEED_TRACK_ID = "test-track-partial"; // Replace with real track ID
  const SEED_FRIEND_ID = 1;

  try {
    // Check what embeddings the seed has
    const embeddings = await hasEmbeddings(SEED_TRACK_ID, SEED_FRIEND_ID);
    console.log(`  📊 Seed embeddings: identity=${embeddings.identity}, audio=${embeddings.audio}`);

    const result = await retrieveCandidates(SEED_TRACK_ID, SEED_FRIEND_ID, {
      limitIdentity: 50,
      limitAudio: 50,
    });

    // If seed has no identity embedding, identity results should be 0
    if (!embeddings.identity) {
      assertEqual(
        result.stats.identityCount,
        0,
        "Identity results should be 0 when seed has no identity embedding"
      );
    }

    // If seed has no audio embedding, audio results should be 0
    if (!embeddings.audio) {
      assertEqual(
        result.stats.audioCount,
        0,
        "Audio results should be 0 when seed has no audio embedding"
      );
    }

    // Should still return candidates from whichever embedding exists
    assert(
      result.stats.unionCount > 0 || (!embeddings.identity && !embeddings.audio),
      "Should return candidates if at least one embedding exists"
    );

    console.log("  ✅ Missing embedding test passed");
  } catch (error) {
    console.error("  ❌ Test failed:", error);
    throw error;
  }
}

/**
 * Test 3: Excludes self
 *
 * Ensures that the seed track itself is not included in the results.
 */
async function testExcludesSelf() {
  console.log("\n🧪 Test 3: Excludes Self");

  const SEED_TRACK_ID = "test-track-1"; // Replace with real track ID
  const SEED_FRIEND_ID = 1;

  try {
    const result = await retrieveCandidates(SEED_TRACK_ID, SEED_FRIEND_ID, {
      limitIdentity: 100,
      limitAudio: 100,
    });

    // Verify seed track is not in results
    const seedInResults = result.candidates.some(
      c => c.trackId === SEED_TRACK_ID && c.friendId === SEED_FRIEND_ID
    );

    assert(
      !seedInResults,
      `Seed track ${SEED_TRACK_ID} should not be in results`
    );

    console.log(`  ✅ Seed track excluded (checked ${result.stats.unionCount} candidates)`);
  } catch (error) {
    console.error("  ❌ Test failed:", error);
    throw error;
  }
}

/**
 * Test 4: Similarity score range
 *
 * Ensures that similarity scores are normalized to [0..1].
 */
async function testSimilarityRange() {
  console.log("\n🧪 Test 4: Similarity Score Range");

  const SEED_TRACK_ID = "test-track-1"; // Replace with real track ID
  const SEED_FRIEND_ID = 1;

  try {
    const result = await retrieveCandidates(SEED_TRACK_ID, SEED_FRIEND_ID, {
      limitIdentity: 100,
      limitAudio: 100,
    });

    for (const candidate of result.candidates) {
      // Check identity similarity if present
      if (candidate.simIdentity !== null) {
        assert(
          candidate.simIdentity >= 0 && candidate.simIdentity <= 1,
          `Identity similarity out of range: ${candidate.simIdentity} for track ${candidate.trackId}`
        );
      }

      // Check audio similarity if present
      if (candidate.simAudio !== null) {
        assert(
          candidate.simAudio >= 0 && candidate.simAudio <= 1,
          `Audio similarity out of range: ${candidate.simAudio} for track ${candidate.trackId}`
        );
      }

      // At least one similarity should be present
      assert(
        candidate.simIdentity !== null || candidate.simAudio !== null,
        `Candidate ${candidate.trackId} has no similarity scores`
      );
    }

    console.log(`  ✅ All ${result.stats.unionCount} candidates have valid similarity scores [0..1]`);
  } catch (error) {
    console.error("  ❌ Test failed:", error);
    throw error;
  }
}

/**
 * Test 5: Metadata completeness
 *
 * Ensures that all candidates have required metadata fields.
 */
async function testMetadataCompleteness() {
  console.log("\n🧪 Test 5: Metadata Completeness");

  const SEED_TRACK_ID = "test-track-1"; // Replace with real track ID
  const SEED_FRIEND_ID = 1;

  try {
    const result = await retrieveCandidates(SEED_TRACK_ID, SEED_FRIEND_ID, {
      limitIdentity: 20,
      limitAudio: 20,
    });

    for (const candidate of result.candidates) {
      const meta = candidate.metadata;

      // Required string fields
      assert(typeof meta.title === "string", `Missing title for track ${candidate.trackId}`);
      assert(typeof meta.artist === "string", `Missing artist for track ${candidate.trackId}`);
      assert(typeof meta.album === "string", `Missing album for track ${candidate.trackId}`);

      // Arrays should exist (can be empty)
      assert(Array.isArray(meta.tags), `Tags should be array for track ${candidate.trackId}`);
      assert(Array.isArray(meta.styles), `Styles should be array for track ${candidate.trackId}`);
      assert(Array.isArray(meta.genres), `Genres should be array for track ${candidate.trackId}`);

      // Nullable numeric fields should be null or number
      if (meta.bpm !== null) {
        assert(typeof meta.bpm === "number", `BPM should be number for track ${candidate.trackId}`);
      }
      if (meta.energy !== null) {
        assert(typeof meta.energy === "number", `Energy should be number for track ${candidate.trackId}`);
      }
    }

    console.log(`  ✅ All ${result.stats.unionCount} candidates have complete metadata`);
  } catch (error) {
    console.error("  ❌ Test failed:", error);
    throw error;
  }
}

/**
 * Test 6: Performance timing
 *
 * Ensures that timing stats are recorded.
 */
async function testPerformanceTiming() {
  console.log("\n🧪 Test 6: Performance Timing");

  const SEED_TRACK_ID = "test-track-1"; // Replace with real track ID
  const SEED_FRIEND_ID = 1;

  try {
    const result = await retrieveCandidates(SEED_TRACK_ID, SEED_FRIEND_ID, {
      limitIdentity: 100,
      limitAudio: 100,
    });

    const timing = result.stats.timingMs;

    assert(timing.identityQuery >= 0, "Identity query time should be >= 0");
    assert(timing.audioQuery >= 0, "Audio query time should be >= 0");
    assert(timing.total >= 0, "Total time should be >= 0");
    assert(
      timing.total >= timing.identityQuery,
      "Total time should be >= identity query time"
    );
    assert(
      timing.total >= timing.audioQuery,
      "Total time should be >= audio query time"
    );

    console.log(`  ⏱️  Timing breakdown:`);
    console.log(`    - Identity query: ${timing.identityQuery}ms`);
    console.log(`    - Audio query: ${timing.audioQuery}ms`);
    console.log(`    - Total: ${timing.total}ms`);
    console.log("  ✅ Performance timing recorded correctly");
  } catch (error) {
    console.error("  ❌ Test failed:", error);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("=".repeat(60));
  console.log("🧪 Recommendation Candidate Retriever Tests");
  console.log("=".repeat(60));

  console.log("\n⚠️  NOTE: These tests require actual track IDs with embeddings.");
  console.log("⚠️  Update the SEED_TRACK_ID constants with real values from your DB.\n");

  const tests = [
    { name: "Union Deduplication", fn: testUnionDeduplication },
    { name: "Missing Embedding Handling", fn: testMissingEmbedding },
    { name: "Excludes Self", fn: testExcludesSelf },
    { name: "Similarity Range", fn: testSimilarityRange },
    { name: "Metadata Completeness", fn: testMetadataCompleteness },
    { name: "Performance Timing", fn: testPerformanceTiming },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.fn();
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

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error("Fatal error running tests:", error);
    process.exit(1);
  });
}
