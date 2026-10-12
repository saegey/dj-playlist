import { describe, expect, it, vi } from "vitest";
import { extractKeyAnalysis, isKeyConfidenceLow, logKeyProfileDisagreement } from "@/lib/essentiaKey";

describe("extractKeyAnalysis", () => {
  it("formats the edma key/scale and rounds its strength", () => {
    expect(
      extractKeyAnalysis({
        key_edma: { key: "C", scale: "major", strength: 0.6177087426190001 },
      })
    ).toEqual({ key: "C major", key_confidence: 0.618 });
  });

  it("returns nulls when tonal is missing", () => {
    expect(extractKeyAnalysis(undefined)).toEqual({ key: null, key_confidence: null });
  });

  it("returns a null key when key_edma has no key or scale", () => {
    expect(extractKeyAnalysis({ key_edma: { strength: 0.5 } })).toEqual({
      key: null,
      key_confidence: 0.5,
    });
  });

  it("returns a null confidence when key_edma has no strength", () => {
    expect(
      extractKeyAnalysis({ key_edma: { key: "D", scale: "minor" } })
    ).toEqual({ key: "D minor", key_confidence: null });
  });
});

describe("isKeyConfidenceLow", () => {
  it("is true below the threshold", () => {
    expect(isKeyConfidenceLow(0.59)).toBe(true);
  });

  it("is false at or above the threshold", () => {
    expect(isKeyConfidenceLow(0.6)).toBe(false);
    expect(isKeyConfidenceLow(0.9)).toBe(false);
  });

  it("is false when there is no confidence to judge", () => {
    expect(isKeyConfidenceLow(null)).toBe(false);
    expect(isKeyConfidenceLow(undefined)).toBe(false);
  });
});

describe("logKeyProfileDisagreement", () => {
  const context = { track_id: "trk_001", friend_id: 1 };

  it("logs nothing when all three profiles agree", () => {
    const log = vi.fn();
    logKeyProfileDisagreement(
      {
        key_edma: { key: "D", scale: "minor" },
        key_krumhansl: { key: "D", scale: "minor" },
        key_temperley: { key: "D", scale: "minor" },
      },
      context,
      log
    );
    expect(log).not.toHaveBeenCalled();
  });

  it("logs the F/C major confusion that prompted #524", () => {
    const log = vi.fn();
    logKeyProfileDisagreement(
      {
        key_edma: { key: "F", scale: "major" },
        key_krumhansl: { key: "C", scale: "major" },
        key_temperley: { key: "C", scale: "major" },
      },
      context,
      log
    );
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toContain("trk_001");
    expect(log.mock.calls[0][0]).toContain("stored edma=F major");
    expect(log.mock.calls[0][0]).toContain("krumhansl=C major");
    expect(log.mock.calls[0][0]).toContain("temperley=C major");
  });

  it("logs only the profile that actually disagrees", () => {
    const log = vi.fn();
    logKeyProfileDisagreement(
      {
        key_edma: { key: "F", scale: "major" },
        key_krumhansl: { key: "F", scale: "major" },
        key_temperley: { key: "C", scale: "major" },
      },
      context,
      log
    );
    expect(log.mock.calls[0][0]).not.toContain("krumhansl=");
    expect(log.mock.calls[0][0]).toContain("temperley=C major");
  });

  it("does nothing when there is no stored edma key", () => {
    const log = vi.fn();
    logKeyProfileDisagreement(
      { key_krumhansl: { key: "C", scale: "major" } },
      context,
      log
    );
    expect(log).not.toHaveBeenCalled();
  });

  it("does nothing when tonal is missing", () => {
    const log = vi.fn();
    logKeyProfileDisagreement(undefined, context, log);
    expect(log).not.toHaveBeenCalled();
  });

  it("defaults to console.warn when no logger is given", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logKeyProfileDisagreement(
      {
        key_edma: { key: "F", scale: "major" },
        key_krumhansl: { key: "C", scale: "major" },
      },
      context
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});
