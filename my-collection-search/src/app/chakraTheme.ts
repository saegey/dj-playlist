import { defineConfig, createSystem, defaultConfig, type SystemStyleObject } from "@chakra-ui/react";
import {
  defaultPaletteId,
  paletteVariableNames,
  palettes,
  statusNames,
  type Palette,
  type PaletteVariable,
} from "./palettes";

const v = (name: PaletteVariable) => ({ value: `var(${name})` });

// Neutral steps (row hover, pressed) derived from ink over ground, so a palette
// needs no extra variables for them.
const mix = (percent: number) => ({
  value: `color-mix(in srgb, var(--gn-ink) ${percent}%, var(--gn-ground))`,
});

const statusTokens = Object.fromEntries(
  statusNames.map((status) => [
    status,
    {
      fg: v(`--gn-status-${status}-fg`),
      subtle: v(`--gn-status-${status}-subtle`),
      border: v(`--gn-status-${status}-border`),
    },
  ]),
);

function declarations(values: Palette["light"]) {
  return Object.fromEntries(
    paletteVariableNames.map((name) => [name, values[name]]),
  ) as Record<PaletteVariable, string>;
}

// Light blocks come first so an equally specific later palette wins. The
// default palette also answers on :root, so an unknown or missing
// data-palette still gets a complete set of variables.
export function paletteBlocks(
  all: Record<string, Palette>,
  defaultId: string,
): Record<string, SystemStyleObject> {
  return Object.fromEntries(
    Object.entries(all).flatMap(([id, palette]) => {
      const root = id === defaultId;
      return [
        [`${root ? ":root, " : ""}[data-palette="${id}"]`, declarations(palette.light)],
        [`${root ? ":root.dark, " : ""}[data-palette="${id}"].dark`, declarations(palette.dark)],
      ];
    }),
  );
}

const config = defineConfig({
  globalCss: paletteBlocks(palettes, defaultPaletteId),
  theme: {
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: v("--gn-ground"),
          subtle: v("--gn-surface"),
          muted: mix(6),
          emphasized: mix(12),
          panel: v("--gn-surface"),
          error: v("--gn-status-missing-subtle"),
          warning: v("--gn-status-analysis-subtle"),
          success: v("--gn-status-success-subtle"),
        },
        fg: {
          DEFAULT: v("--gn-ink"),
          muted: v("--gn-ink-muted"),
          subtle: v("--gn-ink-muted"),
          error: v("--gn-status-missing-fg"),
          warning: v("--gn-status-analysis-fg"),
          success: v("--gn-status-success-fg"),
        },
        border: {
          DEFAULT: v("--gn-border"),
          subtle: v("--gn-border"),
          error: v("--gn-status-missing-border"),
          warning: v("--gn-status-analysis-border"),
          success: v("--gn-status-success-border"),
        },
        // The app's one accent: active filters, primary actions, playback
        // progress. A full virtual palette, so colorPalette="accent" works.
        accent: {
          solid: v("--gn-accent-solid"),
          contrast: v("--gn-accent-contrast"),
          fg: v("--gn-accent-fg"),
          subtle: v("--gn-accent-subtle"),
          muted: v("--gn-accent-muted"),
          emphasized: v("--gn-accent-emphasized"),
          focusRing: v("--gn-accent-focus-ring"),
          border: v("--gn-accent-border"),
        },
        status: statusTokens,
      },
      shadows: {
        xs: { value: "0 1px 2px var(--gn-shadow)" },
        sm: { value: "0 1px 3px var(--gn-shadow)" },
        md: { value: "0 4px 8px var(--gn-shadow)" },
        lg: { value: "0 8px 16px var(--gn-shadow)" },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
