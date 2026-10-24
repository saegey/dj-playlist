// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import FilterChips from "./FilterChips";

const chips = [
  { key: "a", label: "No BPM", active: true },
  { key: "b", label: "No embedding", active: false },
];

describe("FilterChips", () => {
  it("toggles a chip and clears all once one is active", async () => {
    const onToggle = vi.fn();
    const onClearAll = vi.fn();
    const { user } = renderWithProviders(<FilterChips chips={chips} onToggle={onToggle} onClearAll={onClearAll} />);

    await user.click(screen.getByRole("button", { name: "No embedding" }));
    await user.click(screen.getByRole("button", { name: "Clear all" }));

    expect(onToggle).toHaveBeenCalledWith("b");
    expect(onClearAll).toHaveBeenCalled();
  });

  it("offers no clear-all when nothing is active", () => {
    renderWithProviders(
      <FilterChips chips={chips.map((c) => ({ ...c, active: false }))} onToggle={vi.fn()} onClearAll={vi.fn()} />
    );

    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
  });
});
