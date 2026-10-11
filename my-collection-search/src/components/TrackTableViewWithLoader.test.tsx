// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { sampleTrack } from "@/stories/fixtures/track";
import type { Track } from "@/types/track";

const state = vi.hoisted(() => ({ track: {} as Track }));
vi.mock("@/hooks/useTrack", () => ({ useTrack: () => state.track }));
vi.mock("@/hooks/useTracksQuery", () => ({ useTracksQuery: () => ({ saveTrack: vi.fn() }) }));
vi.mock("@/providers/PlaylistPlayerProvider", () => ({ usePlaylistPlayer: () => ({ replacePlaylist: vi.fn() }) }));
import Table from "./TrackTableViewWithLoader";

describe("track table album taxonomy badges", () => {
  it.each([
    { album_genres: ["Jazz"], album_styles: ["Fusion"], visible: "Jazz" },
    { album_genres: [], album_styles: [], visible: null },
    { visible: "Source" },
  ])("renders effective values with source fallback only when absent: %j", (values) => {
    state.track = { ...sampleTrack, genres: ["Source"], styles: ["Source Style"], ...values };
    renderWithProviders(<Table trackInfo={[{ trackId: "t", friendId: 7 }]} />);
    if (values.visible) expect(screen.getByText(values.visible)).toBeTruthy();
    if ("album_genres" in values) expect(screen.queryByText("Source")).toBeNull();
  });
});
