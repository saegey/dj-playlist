/**
 * Run with:
 * npx tsx src/providers/playlist-player/__tests__/queue-state.test.ts
 */

import type { Track } from "@/types/track";
import {
  adjustCurrentIndexAfterMove,
  reorderPlaylist,
  removeFromPlaylist,
} from "@/providers/playlist-player/useQueueState";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}. expected=${String(expected)} actual=${String(actual)}`);
  }
}

function makeTrack(id: string): Track {
  return {
    id: Number(id.replace(/\D/g, "")) || 1,
    track_id: id,
    title: `Title ${id}`,
    artist: "Artist",
    album: "Album",
    year: 2020,
    duration: "3:00",
    position: 1,
    discogs_url: "",
    apple_music_url: "",
    friend_id: 1,
  };
}

function testAdjustCurrentIndexAfterMove() {
  assertEqual(adjustCurrentIndexAfterMove(null, 1, 2), null, "null current index remains null");
  assertEqual(adjustCurrentIndexAfterMove(2, 2, 4), 4, "moved current track follows new index");
  assertEqual(
    adjustCurrentIndexAfterMove(3, 1, 4),
    2,
    "moving track from before current to after current decrements index"
  );
  assertEqual(
    adjustCurrentIndexAfterMove(2, 4, 1),
    3,
    "moving track from after current to before current increments index"
  );
  assertEqual(adjustCurrentIndexAfterMove(2, 0, 1), 2, "unrelated move keeps current index");
}

function testReorderPlaylist() {
  const tracks = [makeTrack("a"), makeTrack("b"), makeTrack("c"), makeTrack("d")];
  const reordered = reorderPlaylist(tracks, 1, 3);
  const ids = reordered.map((t) => t.track_id).join(",");
  assertEqual(ids, "a,c,d,b", "reorder should move source item into destination");
}

function testRemoveFromPlaylist() {
  const tracks = [makeTrack("a"), makeTrack("b"), makeTrack("c"), makeTrack("d")];

  const caseNoCurrent = removeFromPlaylist(tracks, 1, null);
  assertEqual(caseNoCurrent.nextCurrentTrackIndex, null, "no current track remains null");
  assert(!caseNoCurrent.shouldStop, "no current track should not stop playback");

  const caseCurrentRemovedWithNext = removeFromPlaylist(tracks, 1, 1);
  assertEqual(
    caseCurrentRemovedWithNext.nextCurrentTrackIndex,
    1,
    "when current removed and next exists, next takes same index"
  );
  assert(!caseCurrentRemovedWithNext.shouldStop, "should continue playback when queue still has tracks");

  const caseCurrentRemovedAtEnd = removeFromPlaylist(tracks, 3, 3);
  assertEqual(
    caseCurrentRemovedAtEnd.nextCurrentTrackIndex,
    2,
    "when current last track removed, current moves to new last track"
  );

  const oneTrack = [makeTrack("only")];
  const caseOnlyTrack = removeFromPlaylist(oneTrack, 0, 0);
  assertEqual(caseOnlyTrack.nextCurrentTrackIndex, null, "removing only current track clears index");
  assert(caseOnlyTrack.shouldStop, "removing only current track should stop playback");

  const caseRemoveBeforeCurrent = removeFromPlaylist(tracks, 1, 3);
  assertEqual(
    caseRemoveBeforeCurrent.nextCurrentTrackIndex,
    2,
    "removing before current shifts current index down"
  );

  const caseRemoveAfterCurrent = removeFromPlaylist(tracks, 3, 1);
  assertEqual(
    caseRemoveAfterCurrent.nextCurrentTrackIndex,
    1,
    "removing after current keeps current index"
  );
}

function run() {
  testAdjustCurrentIndexAfterMove();
  testReorderPlaylist();
  testRemoveFromPlaylist();
  console.log("queue-state tests passed");
}

try {
  run();
} catch (error) {
  console.error("queue-state tests failed");
  console.error(error);
  process.exit(1);
}
