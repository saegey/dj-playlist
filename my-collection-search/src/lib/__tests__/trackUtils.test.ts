import { describe, it, expect } from "vitest";
import {
  parseDurationToSeconds,
  formatSeconds,
  getTrackDurationSeconds,
} from "../trackUtils";

describe("parseDurationToSeconds", () => {
  it.each([
    ["3:45", 225],
    ["10:05", 605],
    ["0:30", 30],
    ["0:00", 0],
    ["1:00:00", 3600],
    ["1:01:01", 3661],
    ["2:30:00", 9000],
    ["45", 45],
    ["", 0],
  ])("parseDurationToSeconds(%s) === %d", (input, expected) => {
    expect(parseDurationToSeconds(input)).toBe(expected);
  });
});

describe("formatSeconds", () => {
  it.each([
    [225, "3:45"],
    [605, "10:05"],
    [30, "0:30"],
    [0, "0:00"],
    [3600, "1:00:00"],
    [3661, "1:01:01"],
    [9000, "2:30:00"],
    [59, "0:59"],
    [60, "1:00"],
  ])("formatSeconds(%d) === %s", (input, expected) => {
    expect(formatSeconds(input)).toBe(expected);
  });

  it("parseDurationToSeconds and formatSeconds are inverses", () => {
    const cases = ["3:45", "1:01:01", "0:30", "10:05", "2:30:00"];
    for (const dur of cases) {
      expect(formatSeconds(parseDurationToSeconds(dur))).toBe(dur);
    }
  });
});

describe("getTrackDurationSeconds", () => {
  it("returns duration_seconds when positive", () => {
    expect(getTrackDurationSeconds({ duration_seconds: 225 })).toBe(225);
  });

  it("falls back to parsing duration string when duration_seconds is absent", () => {
    expect(getTrackDurationSeconds({ duration: "3:45" })).toBe(225);
  });

  it("falls back to duration string when duration_seconds is 0", () => {
    expect(getTrackDurationSeconds({ duration_seconds: 0, duration: "3:45" })).toBe(225);
  });

  it("falls back to duration string when duration_seconds is null", () => {
    expect(getTrackDurationSeconds({ duration_seconds: null, duration: "3:45" })).toBe(225);
  });

  it("returns null when both fields are absent", () => {
    expect(getTrackDurationSeconds({})).toBeNull();
  });

  it("returns null when duration_seconds is 0 and duration is null", () => {
    expect(getTrackDurationSeconds({ duration_seconds: 0, duration: null })).toBeNull();
  });

  it("returns null when duration parses to 0", () => {
    expect(getTrackDurationSeconds({ duration: "0:00" })).toBeNull();
  });
});
