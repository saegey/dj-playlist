import { describe, expect, it } from "vitest";
import {
  compareTrackPositions,
  getTrackSideLabel,
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
});
