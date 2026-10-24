import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

const loaded = vi.hoisted(() => [] as Array<Record<string, unknown>>);
vi.mock("next/font/local", () => ({
  default: (options: Record<string, unknown>) => {
    loaded.push(options);
    return { variable: `class-for-${options.variable}` };
  },
}));

import { fontClassName } from "./fonts";

describe("fonts", () => {
  it("loads heading, body and mono as swappable CSS variables", () => {
    expect(loaded.map((o) => o.variable)).toEqual(["--gn-font-heading", "--gn-font-body", "--gn-font-mono"]);
    expect(fontClassName).toBe(loaded.map((o) => `class-for-${o.variable}`).join(" "));
  });

  it("swaps in with display: swap", () => {
    for (const options of loaded) expect(options.display).toBe("swap");
  });

  it("commits every font file and a licence for each family", () => {
    for (const options of loaded) {
      for (const { path: file } of options.src as Array<{ path: string }>) {
        expect(existsSync(path.join(import.meta.dirname, file)), file).toBe(true);
      }
    }
    expect(existsSync(path.join(import.meta.dirname, "fonts/OFL-BarlowCondensed.txt"))).toBe(true);
    expect(existsSync(path.join(import.meta.dirname, "fonts/OFL-IBMPlex.txt"))).toBe(true);
  });
});
