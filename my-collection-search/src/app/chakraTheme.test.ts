import { describe, expect, it } from "vitest";
import { system } from "./chakraTheme";

describe("chakra theme", () => {
  it("defines accent.solid as the blue solid colour", () => {
    expect(system.token("colors.accent.solid", "missing")).toBe("var(--chakra-colors-accent-solid)");
    expect(system.tokens.getByName("colors.accent.solid")?.value).toBe("var(--chakra-colors-blue-solid)");
  });
});
