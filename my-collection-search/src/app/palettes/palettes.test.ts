import { describe, expect, it } from "vitest";
import { contrastRatio, luminance } from "./contrast";
import {
  defaultPaletteId,
  isPaletteId,
  paletteIds,
  paletteVariableNames,
  palettes,
  resolvePaletteId,
  statusNames,
  type PaletteVariable,
} from "./index";

const modes = ["light", "dark"] as const;

describe("contrast helper", () => {
  it("computes known ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe.each(Object.entries(palettes))("palette %s", (_id, palette) => {
  it.each(modes)("defines every variable in %s, and nothing else", (mode) => {
    expect(Object.keys(palette[mode]).sort()).toEqual([...paletteVariableNames].sort());
  });

  describe.each(modes)("%s mode", (mode) => {
    const c = palette[mode];
    type Pair = [PaletteVariable, PaletteVariable, number];

    // [foreground, background, minimum WCAG AA ratio]
    const pairs: Pair[] = [
      ["--gn-ink", "--gn-ground", 4.5],
      ["--gn-ink", "--gn-surface", 4.5],
      ["--gn-ink-muted", "--gn-ground", 4.5],
      ["--gn-ink-muted", "--gn-surface", 4.5],
      ["--gn-border", "--gn-ground", 3],
      ["--gn-border", "--gn-surface", 3],
      ["--gn-accent-contrast", "--gn-accent-solid", 4.5],
      ["--gn-accent-fg", "--gn-ground", 4.5],
      ["--gn-accent-fg", "--gn-surface", 4.5],
      ["--gn-accent-fg", "--gn-accent-subtle", 4.5],
      ["--gn-ink", "--gn-accent-subtle", 4.5],
      ["--gn-accent-focus-ring", "--gn-ground", 3],
      ["--gn-accent-focus-ring", "--gn-surface", 3],
      ["--gn-accent-border", "--gn-ground", 3],
      ["--gn-accent-solid", "--gn-ground", 3],
      ...statusNames.flatMap((s): Pair[] => [
        [`--gn-status-${s}-fg`, `--gn-status-${s}-subtle`, 4.5],
        [`--gn-status-${s}-fg`, "--gn-ground", 4.5],
        [`--gn-status-${s}-border`, "--gn-ground", 3],
      ]),
    ];

    it.each(pairs)("%s on %s is at least %d:1", (fg, bg, min) => {
      expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(min);
    });

    // A hard shadow is drawn flat, so a translucent colour would wash out.
    it("defines an opaque shadow colour that differs from the ground", () => {
      expect(c["--gn-shadow"]).toMatch(/^#[0-9a-f]{6}$/i);
      expect(c["--gn-shadow"].toLowerCase()).not.toBe(c["--gn-ground"].toLowerCase());
    });

    it.each(["fg", "subtle"] as const)("separates status %s colours by lightness, not only hue", (part) => {
      const colours = statusNames.map((s) => c[`--gn-status-${s}-${part}`]);
      for (let i = 0; i < colours.length; i++) {
        for (let j = i + 1; j < colours.length; j++) {
          // A luminance ratio, so the dark end of the scale is held to the same standard.
          expect(contrastRatio(colours[i], colours[j]), `${statusNames[i]} vs ${statusNames[j]}`).toBeGreaterThanOrEqual(1.1);
        }
      }
    });
  });
});

describe("palette lookup", () => {
  it("knows the registered ids", () => {
    expect(paletteIds).toEqual(Object.keys(palettes));
    expect(isPaletteId(defaultPaletteId)).toBe(true);
  });

  it.each([undefined, null, 3, "", "nope", "constructor", "__proto__"])("treats %j as the default", (value) => {
    expect(isPaletteId(value)).toBe(false);
    expect(resolvePaletteId(value)).toBe(defaultPaletteId);
  });

  it("keeps a registered id", () => {
    expect(resolvePaletteId("sleeve")).toBe("sleeve");
  });
});
