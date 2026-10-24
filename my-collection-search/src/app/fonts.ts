// Self-hosted faces (woff2 under ./fonts, SIL OFL licences alongside), loaded
// through next/font so they are fingerprinted, preloaded and need no network
// at build time. Each sets a `--gn-font-*` variable that the theme's `heading`,
// `body`, `mono` and `label` tokens read, so a later setting (#670) can swap
// one by overriding the variable. Provisional until #664 is signed off.
import localFont from "next/font/local";

// Condensed display face for headings.
const heading = localFont({
  src: [
    { path: "./fonts/BarlowCondensed-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/BarlowCondensed-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--gn-font-heading",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["Arial Narrow", "Helvetica Neue", "Arial", "sans-serif"],
});

const body = localFont({
  src: [
    { path: "./fonts/IBMPlexSans-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexSans-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBMPlexSans-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--gn-font-body",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

// A slab mono, for labels, IDs and paths.
const mono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexMono-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBMPlexMono-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--gn-font-mono",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});

/** Class names that define the font variables; put them on <html>. */
export const fontClassName = [heading, body, mono].map((font) => font.variable).join(" ");
