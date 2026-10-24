// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";

const pathname = vi.hoisted(() => ({ value: "/chore" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));
const playlist = vi.hoisted(() => ({ length: 0 }));
vi.mock("@/providers/PlaylistPlayerProvider", () => ({
  usePlaylistPlayer: () => ({ playlistLength: playlist.length }),
}));
vi.mock("@/providers/CommandPaletteProvider", () => ({
  useCommandPalette: () => ({ setPaletteOpen: vi.fn() }),
}));
vi.mock("@/components/CommandPalette", () => ({ default: () => null }));
const standaloneMode = vi.hoisted(() => ({ value: false }));
vi.mock("@/hooks/useStandaloneMode", () => ({
  useStandaloneMode: () => standaloneMode.value,
}));

import AppShell from "./AppShell";

describe("AppShell", () => {
  afterEach(() => {
    standaloneMode.value = false;
    pathname.value = "/chore";
    playlist.length = 0;
    localStorage.clear();
  });

  // jsdom ignores media queries, so read the rules Emotion emitted for an
  // element instead of its computed style.
  function rulesFor(el: Element) {
    const classes = [...el.classList];
    return Array.from(document.styleSheets)
      .flatMap((sheet) => Array.from(sheet.cssRules))
      .map((rule) => rule.cssText)
      .filter((css) => classes.some((c) => css.includes(`.${c}`)))
      .join("\n");
  }

  const toggle = () => screen.getByRole("button", { name: /(Collapse|Expand) sidebar/, hidden: true });
  const sidebarOf = () => {
    let el = toggle().parentElement!;
    while (!/position:\s*fixed/.test(rulesFor(el))) el = el.parentElement!;
    return el;
  };
  const contentOf = () => screen.getByText("page").parentElement!;

  it.each(["/chore", "/", "/playlists", "/somewhere-else"])("renders every navigation surface at %s", async (path) => {
    pathname.value = path;
    const { user } = renderWithProviders(<AppShell developerToolsEnabled>page</AppShell>);

    const more = screen.getAllByRole("button", { hidden: true }).find((b) => /menu|more/i.test(b.getAttribute("aria-label") ?? ""));
    if (more) await user.click(more);
    expect(screen.getAllByRole("link", { name: /Chores/, hidden: true }).length).toBeGreaterThan(0);
  });

  it("links to the record-care chores", () => {
    renderWithProviders(<AppShell developerToolsEnabled>page</AppShell>);

    const links = screen.getAllByRole("link", { name: /Chores/, hidden: true });
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((link) => link.getAttribute("href") === "/chore")).toBe(true);
  });

  it("invalidates active data when a standalone app returns to the foreground", () => {
    standaloneMode.value = true;
    const { queryClient } = renderWithProviders(<AppShell developerToolsEnabled>page</AppShell>);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    const originalVisibilityState = document.visibilityState;
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(invalidate).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(invalidate).toHaveBeenCalledTimes(1);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: originalVisibilityState,
    });
  });

  it("pins the desktop sidebar to the viewport instead of the document", () => {
    renderWithProviders(<AppShell developerToolsEnabled>page</AppShell>);

    const css = rulesFor(sidebarOf());
    expect(css).toMatch(/position:\s*fixed/);
    expect(css).toMatch(/top:\s*0/);
    expect(css).toMatch(/bottom:\s*0/);
    expect(css).toMatch(/left:\s*0/);
    expect(css).not.toMatch(/sticky|100vh/);
  });

  it("offsets the content by the sidebar width and follows its state", async () => {
    const { user } = renderWithProviders(<AppShell developerToolsEnabled>page</AppShell>);
    expect(rulesFor(sidebarOf())).toMatch(/width:\s*64px/);
    expect(rulesFor(contentOf())).toMatch(/margin-left:\s*64px/);

    await user.click(toggle());

    expect(rulesFor(sidebarOf())).toMatch(/width:\s*220px/);
    expect(rulesFor(contentOf())).toMatch(/margin-left:\s*220px/);
    expect(JSON.parse(localStorage.getItem("sidebar-expanded")!)).toBe(true);
  });

  it("restores an expanded sidebar from storage", async () => {
    localStorage.setItem("sidebar-expanded", "true");
    renderWithProviders(<AppShell developerToolsEnabled>page</AppShell>);

    await waitFor(() => expect(toggle().getAttribute("aria-label")).toBe("Collapse sidebar"));
    expect(rulesFor(contentOf())).toMatch(/margin-left:\s*220px/);
  });

  it("ignores an unreadable stored sidebar state", () => {
    localStorage.setItem("sidebar-expanded", "{not json");
    renderWithProviders(<AppShell developerToolsEnabled>page</AppShell>);

    expect(toggle()).toBeTruthy();
  });

  it("keeps desktop content clear of the floating player only while it is open", () => {
    const { unmount } = renderWithProviders(<AppShell developerToolsEnabled>page</AppShell>);
    expect(rulesFor(contentOf())).not.toMatch(/124px/);
    unmount();

    playlist.length = 3;
    renderWithProviders(<AppShell developerToolsEnabled>page</AppShell>);
    expect(rulesFor(contentOf())).toMatch(/padding-bottom:\s*124px/);
  });
});
