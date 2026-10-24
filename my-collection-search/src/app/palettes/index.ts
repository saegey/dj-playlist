import { sleeve } from "./sleeve";
import type { Palette } from "./types";

export * from "./types";

/** Add a palette here and it gets its CSS blocks and test coverage. */
export const palettes = { sleeve } satisfies Record<string, Palette>;

export type PaletteId = keyof typeof palettes;

export const defaultPaletteId: PaletteId = "sleeve";

/** Every registered palette id, for validation and for the picker. */
export const paletteIds = Object.keys(palettes) as [PaletteId, ...PaletteId[]];

export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === "string" && Object.hasOwn(palettes, value);
}

/** A stored or requested id as a palette; anything unknown is the default. */
export function resolvePaletteId(value: unknown): PaletteId {
  return isPaletteId(value) ? value : defaultPaletteId;
}
