import { describe, expect, it } from "vitest";
import { paletteBlocks, system } from "./chakraTheme";
import { paletteVariableNames, palettes, statusNames } from "./palettes";

const resolved = (name: string) => system.tokens.getByName(`colors.${name}`)?.value;

describe("chakra theme", () => {
  it("keeps accent.solid working for existing users", () => {
    expect(system.token("colors.accent.solid", "missing")).toBe("var(--chakra-colors-accent-solid)");
    expect(resolved("accent.solid")).toBe("var(--gn-accent-solid)");
  });

  it.each([
    ["bg", "--gn-ground"],
    ["bg.subtle", "--gn-surface"],
    ["bg.panel", "--gn-surface"],
    ["fg", "--gn-ink"],
    ["fg.muted", "--gn-ink-muted"],
    ["fg.subtle", "--gn-ink-muted"],
    ["border", "--gn-border"],
    ["border.subtle", "--gn-border"],
    ["fg.error", "--gn-status-missing-fg"],
    ["fg.warning", "--gn-status-analysis-fg"],
  ])("points %s at %s", (token, variable) => {
    expect(resolved(token)).toBe(`var(${variable})`);
  });

  it("derives neutral bg steps from ink over ground", () => {
    for (const token of ["bg.muted", "bg.emphasized"]) {
      expect(resolved(token)).toMatch(/^color-mix\(.*--gn-ink.*--gn-ground/);
    }
  });

  it("defines accent as a full virtual palette", () => {
    for (const part of ["solid", "contrast", "fg", "subtle", "muted", "emphasized", "focusRing", "border"]) {
      expect(resolved(`accent.${part}`), part).toMatch(/^var\(--gn-accent-/);
    }
  });

  it.each(["danger", "neutral"])("defines %s as a full virtual palette", (name) => {
    for (const part of ["solid", "contrast", "fg", "subtle", "muted", "emphasized", "focusRing", "border"]) {
      expect(resolved(`${name}.${part}`), part).toBeTruthy();
    }
  });

  it("keeps overlay colours constant across palettes", () => {
    for (const token of ["overlay.fg", "overlay.fg.muted", "overlay.fg.subtle", "overlay.track", "overlay.scrim", "overlay.backdrop"]) {
      expect(resolved(token), token).not.toMatch(/var\(--gn-/);
    }
  });

  it("defines fg, subtle and border for every status", () => {
    for (const status of statusNames) {
      for (const part of ["fg", "subtle", "border"]) {
        expect(resolved(`status.${status}.${part}`)).toBe(`var(--gn-status-${status}-${part})`);
      }
    }
  });

  it("only references variables that the palette contract declares", () => {
    const known = new Set<string>(paletteVariableNames);
    const semantic = ["bg", "fg", "border", "accent", "status"];
    for (const token of system.tokens.allTokens) {
      if (!semantic.includes(token.name.split(".")[1] ?? "")) continue;
      for (const [, name] of String(token.value).matchAll(/var\((--gn-[a-z-]+)\)/g)) {
        expect(known.has(name), `${token.name} -> ${name}`).toBe(true);
      }
    }
  });

  it("emits light and dark blocks for every palette", () => {
    const css = system._config.globalCss as unknown as Record<string, Record<string, string>>;
    for (const [id, palette] of Object.entries(palettes)) {
      const light = Object.entries(css).find(([sel]) => sel.endsWith(`[data-palette="${id}"]`));
      const dark = Object.entries(css).find(([sel]) => sel.endsWith(`[data-palette="${id}"].dark`));
      expect(light?.[1]).toEqual(palette.light);
      expect(dark?.[1]).toEqual(palette.dark);
    }
  });

  it("falls back to the default palette on :root for an unknown data-palette", () => {
    const css = system._config.globalCss as Record<string, unknown>;
    expect(Object.keys(css)).toContain(`:root, [data-palette="sleeve"]`);
    expect(Object.keys(css)).toContain(`:root.dark, [data-palette="sleeve"].dark`);
  });

  it("scopes only the default palette to :root", () => {
    const blocks = paletteBlocks({ sleeve: palettes.sleeve, other: palettes.sleeve }, "sleeve");
    expect(Object.keys(blocks)).toEqual([
      `:root, [data-palette="sleeve"]`,
      `:root.dark, [data-palette="sleeve"].dark`,
      `[data-palette="other"]`,
      `[data-palette="other"].dark`,
    ]);
  });
});
