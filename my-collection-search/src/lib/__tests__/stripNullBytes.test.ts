import { describe, expect, it } from "vitest";
import { stripNullBytes } from "../stripNullBytes";

describe("stripNullBytes()", () => {
  it("removes every null byte", () => {
    expect(stripNullBytes("a\u0000b\u0000\u0000c")).toBe("abc");
  });

  it("leaves clean strings untouched", () => {
    expect(stripNullBytes("Warm, dubby groove.")).toBe("Warm, dubby groove.");
  });
});
