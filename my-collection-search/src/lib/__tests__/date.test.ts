import { describe, it, expect } from "vitest";
import { formatDate, formatRelativeShort, formatDateWithRelative } from "../date";

// ─── formatDate ───────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("returns '' for invalid date string", () => {
    expect(formatDate("not-a-date")).toBe("");
  });

  it("returns '' for NaN timestamp", () => {
    expect(formatDate(NaN)).toBe("");
  });

  it("formats a Date object", () => {
    // Use a fixed UTC date; the output format is locale-dependent (MMM d, yyyy)
    const d = new Date("2025-01-05T12:00:00Z");
    const result = formatDate(d);
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/Jan|01/);
  });

  it("formats an ISO date string", () => {
    const result = formatDate("2023-06-15T00:00:00Z");
    expect(result).toMatch(/2023/);
  });

  it("formats a numeric timestamp", () => {
    const ts = new Date("2020-03-20T00:00:00Z").getTime();
    const result = formatDate(ts);
    expect(result).toMatch(/2020/);
  });

  it("includes the day in the output", () => {
    // Construct local-time date to avoid UTC midnight shifting the day
    const d = new Date(2025, 6, 15); // July 15, 2025 (local)
    const result = formatDate(d);
    expect(result).toMatch(/15/);
  });
});

// ─── formatRelativeShort ──────────────────────────────────────────────────────

describe("formatRelativeShort", () => {
  it("returns '' for invalid date string", () => {
    expect(formatRelativeShort("not-a-date")).toBe("");
  });

  it("returns seconds ago for very recent date", () => {
    const d = new Date(Date.now() - 30_000); // 30 seconds ago
    const result = formatRelativeShort(d);
    expect(result).toMatch(/^\d+s ago$/);
  });

  it("returns minutes ago", () => {
    const d = new Date(Date.now() - 5 * 60_000); // 5 minutes ago
    const result = formatRelativeShort(d);
    expect(result).toMatch(/^\d+m ago$/);
  });

  it("returns hours ago", () => {
    const d = new Date(Date.now() - 3 * 3600_000); // 3 hours ago
    const result = formatRelativeShort(d);
    expect(result).toMatch(/^\d+h ago$/);
  });

  it("returns days ago", () => {
    const d = new Date(Date.now() - 2 * 86400_000); // 2 days ago
    const result = formatRelativeShort(d);
    expect(result).toMatch(/^\d+d ago$/);
  });

  it("returns months ago", () => {
    const d = new Date(Date.now() - 45 * 86400_000); // ~1.5 months ago
    const result = formatRelativeShort(d);
    expect(result).toMatch(/^\d+mo ago$/);
  });

  it("returns years ago", () => {
    const d = new Date(Date.now() - 400 * 86400_000); // >1 year ago
    const result = formatRelativeShort(d);
    expect(result).toMatch(/^\d+y ago$/);
  });

  it("returns 'from now' for future dates", () => {
    const d = new Date(Date.now() + 5 * 60_000); // 5 minutes from now
    const result = formatRelativeShort(d);
    expect(result).toMatch(/from now$/);
  });

  it("prioritizes larger units (years over months)", () => {
    const d = new Date(Date.now() - 2 * 365 * 86400_000);
    const result = formatRelativeShort(d);
    expect(result).toMatch(/y ago/);
    expect(result).not.toMatch(/mo ago/);
  });
});

// ─── formatDateWithRelative ───────────────────────────────────────────────────

describe("formatDateWithRelative", () => {
  it("combines date and relative with ' • ' separator", () => {
    const d = new Date(Date.now() - 2 * 86400_000);
    const result = formatDateWithRelative(d);
    expect(result).toContain(" • ");
  });

  it("contains both the absolute date year and relative string", () => {
    const d = new Date(Date.now() - 2 * 86400_000);
    const result = formatDateWithRelative(d);
    const year = new Date().getFullYear().toString();
    expect(result).toMatch(new RegExp(year));
    expect(result).toMatch(/ago/);
  });

  it("returns just the date when relative part is empty (invalid input passes both funcs)", () => {
    // For invalid input both formatDate and formatRelativeShort return ""
    // formatDateWithRelative returns date (which is "") since rel is ""
    expect(formatDateWithRelative("not-a-date")).toBe("");
  });
});
