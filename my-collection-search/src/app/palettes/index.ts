import { sleeve } from "./sleeve";
import type { Palette } from "./types";

export * from "./types";

/** Add a palette here and it gets its CSS blocks and test coverage. */
export const palettes = { sleeve } satisfies Record<string, Palette>;

export type PaletteId = keyof typeof palettes;

export const defaultPaletteId: PaletteId = "sleeve";
