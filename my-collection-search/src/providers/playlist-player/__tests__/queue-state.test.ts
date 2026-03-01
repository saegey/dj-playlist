import { describe, it, expect } from "vitest";
import type { Track } from "@/types/track";
import {
  adjustCurrentIndexAfterMove,
  reorderPlaylist,
  removeFromPlaylist,
} from "@/providers/playlist-player/useQueueState";

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

describe("adjustCurrentIndexAfterMove", () => {
  it("returns null when current index is null", () => {
    expect(adjustCurrentIndexAfterMove(null, 1, 2)).toBeNull();
  });

  it("follows the moved track when it is the current track", () => {
    expect(adjustCurrentIndexAfterMove(2, 2, 4)).toBe(4);
  });

  it("decrements index when a track before current moves to after current", () => {
    expect(adjustCurrentIndexAfterMove(3, 1, 4)).toBe(2);
  });

  it("increments index when a track after current moves to before current", () => {
    expect(adjustCurrentIndexAfterMove(2, 4, 1)).toBe(3);
  });

  it("keeps current index for unrelated moves", () => {
    expect(adjustCurrentIndexAfterMove(2, 0, 1)).toBe(2);
  });
});

describe("reorderPlaylist", () => {
  it("moves an item from source to destination index", () => {
    const tracks = [makeTrack("a"), makeTrack("b"), makeTrack("c"), makeTrack("d")];
    const reordered = reorderPlaylist(tracks, 1, 3);
    expect(reordered.map((t) => t.track_id).join(",")).toBe("a,c,d,b");
  });
});

describe("removeFromPlaylist", () => {
  const tracks = [makeTrack("a"), makeTrack("b"), makeTrack("c"), makeTrack("d")];

  it("keeps current index null when there is no current track", () => {
    const result = removeFromPlaylist(tracks, 1, null);
    expect(result.nextCurrentTrackIndex).toBeNull();
    expect(result.shouldStop).toBe(false);
  });

  it("keeps the same index when current track is removed and a next track exists", () => {
    const result = removeFromPlaylist(tracks, 1, 1);
    expect(result.nextCurrentTrackIndex).toBe(1);
    expect(result.shouldStop).toBe(false);
  });

  it("moves to the previous track when the last track is removed", () => {
    const result = removeFromPlaylist(tracks, 3, 3);
    expect(result.nextCurrentTrackIndex).toBe(2);
  });

  it("clears index and stops when the only track is removed", () => {
    const result = removeFromPlaylist([makeTrack("only")], 0, 0);
    expect(result.nextCurrentTrackIndex).toBeNull();
    expect(result.shouldStop).toBe(true);
  });

  it("decrements current index when a track before it is removed", () => {
    const result = removeFromPlaylist(tracks, 1, 3);
    expect(result.nextCurrentTrackIndex).toBe(2);
  });

  it("keeps current index when a track after it is removed", () => {
    const result = removeFromPlaylist(tracks, 3, 1);
    expect(result.nextCurrentTrackIndex).toBe(1);
  });
});
