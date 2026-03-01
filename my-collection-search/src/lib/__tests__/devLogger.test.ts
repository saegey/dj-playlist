import { describe, it, expect } from "vitest";
import { diffObjectKeys } from "../devLogger";

describe("diffObjectKeys", () => {
  it("returns empty object when both are undefined", () => {
    expect(diffObjectKeys(undefined, undefined)).toEqual({});
  });

  it("returns empty object when both are identical", () => {
    const obj = { a: 1, b: "hello" };
    expect(diffObjectKeys(obj, obj)).toEqual({});
  });

  it("returns empty object when before and after have the same values", () => {
    expect(diffObjectKeys({ a: 1 }, { a: 1 })).toEqual({});
  });

  it("marks a new key as 'added'", () => {
    expect(diffObjectKeys({}, { a: 42 })).toEqual({ a: "added" });
  });

  it("marks a removed key as 'removed'", () => {
    expect(diffObjectKeys({ a: 42 }, {})).toEqual({ a: "removed" });
  });

  it("records { from, to } for a changed value", () => {
    expect(diffObjectKeys({ a: 1 }, { a: 2 })).toEqual({ a: { from: 1, to: 2 } });
  });

  it("handles value changing to undefined as 'removed'", () => {
    expect(diffObjectKeys({ a: 1, b: 2 }, { a: 1 })).toEqual({ b: "removed" });
  });

  it("handles value changing from undefined as 'added'", () => {
    expect(diffObjectKeys({ a: 1 }, { a: 1, b: 99 })).toEqual({ b: "added" });
  });

  it("handles multiple simultaneous changes", () => {
    const before = { a: 1, b: 2, c: 3 };
    const after = { a: 1, b: 99, d: 4 };
    expect(diffObjectKeys(before, after)).toEqual({
      b: { from: 2, to: 99 },
      c: "removed",
      d: "added",
    });
  });

  it("does not include unchanged keys in result", () => {
    const result = diffObjectKeys({ a: 1, b: 2 }, { a: 1, b: 3 });
    expect(result).not.toHaveProperty("a");
    expect(result).toHaveProperty("b");
  });

  it("treats value change to null as a value change (not removal)", () => {
    // null !== undefined, so it's a changed value not 'removed'
    expect(diffObjectKeys({ a: 1 }, { a: null })).toEqual({ a: { from: 1, to: null } });
  });

  it("handles before=undefined (treats all after keys as added)", () => {
    expect(diffObjectKeys(undefined, { x: 1, y: 2 })).toEqual({
      x: "added",
      y: "added",
    });
  });

  it("handles after=undefined (treats all before keys as removed)", () => {
    expect(diffObjectKeys({ x: 1, y: 2 }, undefined)).toEqual({
      x: "removed",
      y: "removed",
    });
  });

  it("uses strict equality (does not deeply compare objects)", () => {
    // Two separate object references with same structure are !== in JS
    const before = { a: { nested: true } };
    const after = { a: { nested: true } };
    // Since the references differ, it should report a change
    expect(diffObjectKeys(before, after)).toEqual({
      a: { from: { nested: true }, to: { nested: true } },
    });
  });
});
