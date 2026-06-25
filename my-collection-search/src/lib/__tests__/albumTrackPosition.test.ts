import { describe, expect, it } from "vitest";
import {
  compareTrackPositions,
  getTrackSideLabel,
  normalizeAlbumTrackSides,
  parseTrackPosition,
} from "../albumTrackPosition";

describe("parseTrackPosition", () => {
  it("extracts record sides from Discogs-style positions", () => {
    expect(parseTrackPosition("A1")).toMatchObject({
      raw: "A1",
      side: "A",
      sideLabel: "Side A",
      num: 1,
    });
    expect(parseTrackPosition("b12")).toMatchObject({
      raw: "b12",
      side: "B",
      sideLabel: "Side B",
      num: 12,
    });
  });

  it("preserves multi-letter sides", () => {
    expect(parseTrackPosition("AA1")).toMatchObject({
      side: "AA",
      sideLabel: "Side AA",
      num: 1,
      classification: "multi-letter-side",
    });
  });

  it("maps numeric disc-track formats to deterministic disc groups", () => {
    expect(parseTrackPosition("1-1")).toMatchObject({
      side: "DISC-1",
      sideLabel: "Disc 1",
      num: 1,
      classification: "disc-track",
    });
    expect(parseTrackPosition("2.3")).toMatchObject({
      side: "DISC-2",
      sideLabel: "Disc 2",
      num: 3,
      classification: "disc-track",
    });
  });

  it("does not create a side label for plain numeric positions", () => {
    expect(getTrackSideLabel(3)).toBeNull();
    expect(getTrackSideLabel("12")).toBeNull();
  });

  it("sorts sides and track numbers naturally", () => {
    const positions = ["B2", "A10", "A2", "B1", "A1"];
    expect([...positions].sort(compareTrackPositions)).toEqual([
      "A1",
      "A2",
      "A10",
      "B1",
      "B2",
    ]);
  });

  it("sorts numeric multi-disc positions deterministically", () => {
    const positions = ["2-2", "1-10", "1-2", "2-1", "1-1"];
    expect([...positions].sort(compareTrackPositions)).toEqual([
      "1-1",
      "1-2",
      "1-10",
      "2-1",
      "2-2",
    ]);
  });
});

describe("normalizeAlbumTrackSides", () => {
  it("groups single-letter vinyl sides", () => {
    const groups = normalizeAlbumTrackSides([
      { track_id: "b1", position: "B1" },
      { track_id: "a2", position: "A2" },
      { track_id: "a1", position: "A1" },
    ]);

    expect(groups.map((group) => ({
      side_key: group.side_key,
      side_label: group.side_label,
      tracks: group.tracks.map((track) => track.track_id),
    }))).toEqual([
      { side_key: "A", side_label: "Side A", tracks: ["a1", "a2"] },
      { side_key: "B", side_label: "Side B", tracks: ["b1"] },
    ]);
  });

  it("groups AA/BB style positions as distinct sides", () => {
    const groups = normalizeAlbumTrackSides([
      { track_id: "bb1", position: "BB1" },
      { track_id: "aa2", position: "AA2" },
      { track_id: "aa1", position: "AA1" },
    ]);

    expect(groups.map((group) => group.side_key)).toEqual(["AA", "BB"]);
    expect(groups[0].tracks.map((track) => track.track_id)).toEqual(["aa1", "aa2"]);
  });

  it("falls back to disc groups for 1-1 style multi-disc positions", () => {
    const groups = normalizeAlbumTrackSides([
      { track_id: "disc2a", position: "2-1" },
      { track_id: "disc1b", position: "1-2" },
      { track_id: "disc1a", position: "1-1" },
    ]);

    expect(groups.map((group) => ({
      side_key: group.side_key,
      side_label: group.side_label,
      tracks: group.tracks.map((track) => track.track_id),
    }))).toEqual([
      { side_key: "DISC-1", side_label: "Disc 1", tracks: ["disc1a", "disc1b"] },
      { side_key: "DISC-2", side_label: "Disc 2", tracks: ["disc2a"] },
    ]);
  });

  it("uses Tracklist as deterministic fallback for plain numeric positions", () => {
    const groups = normalizeAlbumTrackSides([
      { track_id: "t2", position: "2" },
      { track_id: "t1", position: "1" },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].side_key).toBe("TRACKLIST");
    expect(groups[0].side_label).toBe("Tracklist");
    expect(groups[0].tracks.map((track) => track.track_id)).toEqual(["t1", "t2"]);
  });
});
