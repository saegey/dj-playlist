// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { palettes, paletteIds } from "@/app/palettes";
import { sleeve } from "@/app/palettes/sleeve";

const api = vi.hoisted(() => ({
  fetchAppearanceSettings: vi.fn(),
  updateAppearanceSettings: vi.fn(),
}));
const toast = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/services/internalApi/settings", () => api);
vi.mock("@/components/ui/toaster", () => ({ toaster: toast }));

import AppearanceSettingsSection from "./AppearanceSettingsSection";

const riso = {
  light: { ...sleeve.light, "--gn-ground": "#ffe8f0" },
  dark: { ...sleeve.dark, "--gn-ground": "#301020" },
};

function addRiso() {
  (palettes as Record<string, unknown>).riso = riso;
  paletteIds.push("riso" as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  document.documentElement.dataset.palette = "sleeve";
  document.documentElement.className = "";
  api.fetchAppearanceSettings.mockResolvedValue({ palette: "sleeve" });
  api.updateAppearanceSettings.mockImplementation(async ({ palette }) => ({ palette }));
});

afterEach(() => {
  delete (palettes as Record<string, unknown>).riso;
  const at = paletteIds.indexOf("riso" as never);
  if (at >= 0) paletteIds.splice(at, 1);
});

describe("AppearanceSettingsSection palette", () => {
  it("shows a card per registered palette, with the saved one selected", async () => {
    renderWithProviders(<AppearanceSettingsSection />);

    const sleeveCard = await screen.findByRole("radio", { name: /sleeve/i });
    await waitFor(() => expect(sleeveCard.getAttribute("aria-checked")).toBe("true"));
    expect(screen.getAllByRole("radio", { name: /sleeve|riso/i })).toHaveLength(1);
  });

  it("paints each card's swatches from the palette in the current mode", async () => {
    addRiso();
    renderWithProviders(<AppearanceSettingsSection />);

    const card = await screen.findByRole("radio", { name: /riso/i });
    const ground = card.querySelector<HTMLElement>("[title=Ground]");
    expect(ground?.style.backgroundColor).toBe("rgb(255, 232, 240)");
    expect(card.querySelectorAll("[title]")).toHaveLength(4);
  });

  it("lists every palette in the registry and applies the chosen one at once", async () => {
    addRiso();
    const { user } = renderWithProviders(<AppearanceSettingsSection />);
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: /sleeve/i }).getAttribute("aria-checked")).toBe("true")
    );

    await user.click(screen.getByRole("radio", { name: /riso/i }));

    expect(document.documentElement.dataset.palette).toBe("riso");
    await waitFor(() => expect(api.updateAppearanceSettings).toHaveBeenCalledWith({ palette: "riso" }));
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: /riso/i }).getAttribute("aria-checked")).toBe("true")
    );
    expect(screen.getByRole("radio", { name: /sleeve/i }).getAttribute("aria-checked")).toBe("false");
  });

  it("selects the card as soon as it is clicked, before the save returns", async () => {
    addRiso();
    let finish: (value: { palette: string }) => void = () => {};
    api.updateAppearanceSettings.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { user } = renderWithProviders(<AppearanceSettingsSection />);
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: /sleeve/i }).getAttribute("aria-checked")).toBe("true")
    );

    await user.click(screen.getByRole("radio", { name: /riso/i }));

    expect(screen.getByRole("radio", { name: /riso/i }).getAttribute("aria-checked")).toBe("true");
    finish({ palette: "riso" });
    await waitFor(() => expect(api.updateAppearanceSettings).toHaveBeenCalled());
  });

  it("doesn't save when the selected palette is clicked again", async () => {
    const { user } = renderWithProviders(<AppearanceSettingsSection />);
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: /sleeve/i }).getAttribute("aria-checked")).toBe("true")
    );

    await user.click(screen.getByRole("radio", { name: /sleeve/i }));

    expect(api.updateAppearanceSettings).not.toHaveBeenCalled();
  });

  it("puts the page back and says so when saving fails", async () => {
    addRiso();
    api.updateAppearanceSettings.mockRejectedValue(new Error("db down"));
    const { user } = renderWithProviders(<AppearanceSettingsSection />);
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: /sleeve/i }).getAttribute("aria-checked")).toBe("true")
    );

    await user.click(screen.getByRole("radio", { name: /riso/i }));

    await waitFor(() => expect(toast.create).toHaveBeenCalledWith(expect.objectContaining({ type: "error", description: "db down" })));
    expect(document.documentElement.dataset.palette).toBe("sleeve");
  });

  it("reports a non-Error failure by its text", async () => {
    addRiso();
    api.updateAppearanceSettings.mockRejectedValue("nope");
    const { user } = renderWithProviders(<AppearanceSettingsSection />);
    await user.click(await screen.findByRole("radio", { name: /riso/i }));
    await waitFor(() => expect(toast.create).toHaveBeenCalledWith(expect.objectContaining({ description: "nope" })));
  });

  it("falls back to the default selection when the saved id is unknown", async () => {
    api.fetchAppearanceSettings.mockResolvedValue({ palette: "retired" });
    renderWithProviders(<AppearanceSettingsSection />);
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: /sleeve/i }).getAttribute("aria-checked")).toBe("true")
    );
  });

  it("says when the saved palette can't be loaded", async () => {
    api.fetchAppearanceSettings.mockRejectedValue(new Error("down"));
    renderWithProviders(<AppearanceSettingsSection />);
    expect(await screen.findByText(/failed to load the saved palette/i)).toBeTruthy();
  });
});

describe("AppearanceSettingsSection mode", () => {
  it("offers light, dark and system, and remembers the choice on this device", async () => {
    const { user } = renderWithProviders(<AppearanceSettingsSection />);

    await user.click(screen.getByText("Dark"));
    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(true));
    expect(localStorage.getItem("theme")).toBe("dark");

    await user.click(screen.getByText("Light"));
    await waitFor(() => expect(document.documentElement.classList.contains("light")).toBe(true));
    expect(localStorage.getItem("theme")).toBe("light");

    await user.click(screen.getByText("System"));
    expect(localStorage.getItem("theme")).toBe("system");
    expect(api.updateAppearanceSettings).not.toHaveBeenCalled();
  });

  it("shows swatches for the current mode", async () => {
    addRiso();
    localStorage.setItem("theme", "dark");
    renderWithProviders(<AppearanceSettingsSection />);

    const card = await screen.findByRole("radio", { name: /riso/i });
    await waitFor(() =>
      expect(card.querySelector<HTMLElement>("[title=Ground]")?.style.backgroundColor).toBe("rgb(48, 16, 32)")
    );
  });
});
