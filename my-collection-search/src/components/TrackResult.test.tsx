// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { sampleTrack } from "@/stories/fixtures/track";
import type { Track } from "@/types/track";

vi.mock("@/providers/PlaylistPlayerProvider", () => ({
  usePlaylistPlayer: () => ({ replacePlaylist: vi.fn(), appendToQueue: vi.fn() }),
}));
vi.mock("@/hooks/useTracksQuery", () => ({ useTracksQuery: () => ({ saveTrack: vi.fn() }) }));
vi.mock("./TrackPlaylistUsage", () => ({ default: () => null }));

import TrackResult from "./TrackResult";

const track = {
  ...sampleTrack,
  local_tags: "Psychedelic Cumbia",
  track_genres: [{ id: "c", name: "Cumbia", slug: "cumbia", parent_id: null, parent_name: null }],
} as Track;

describe("TrackResult data-issue state (#468)", () => {
  // A missing embedding (or BPM) is flagged by the row/card's red styling alone —
  // no separate "No embedding" text badge, since it had nowhere to go without
  // crowding the row layout's already-tight album cell.
  it("never renders a 'No embedding' text badge, regardless of hasVectors", () => {
    const { hasVectors, ...rest } = track;
    const { rerender } = renderWithProviders(<TrackResult track={rest as Track} />);
    expect(screen.queryByText("No embedding")).toBeNull();

    rerender(<TrackResult track={{ ...track, hasVectors: false }} />);
    expect(screen.queryByText("No embedding")).toBeNull();

    rerender(<TrackResult track={{ ...track, hasVectors: true }} />);
    expect(screen.queryByText("No embedding")).toBeNull();
  });
});

describe("TrackResult genre badges (#470)", () => {
  it("badges the track's DJ genres in the default card layout", () => {
    renderWithProviders(<TrackResult track={track} />);

    const row = screen.getByTestId("track-genres");
    expect(within(row).getAllByText("Cumbia").length).toBeGreaterThan(0);
    expect(within(row).queryByText("Psychedelic Cumbia")).toBeNull();
  });

  it("badges the track's DJ genres in the row layout too", () => {
    renderWithProviders(<TrackResult track={track} layout="row" />);

    const row = screen.getByTestId("track-genres");
    expect(within(row).getAllByText("Cumbia").length).toBeGreaterThan(0);
  });

  it("falls back to the raw tags for a track not yet reconciled", () => {
    renderWithProviders(<TrackResult track={{ ...track, track_genres: [] }} />);

    expect(within(screen.getByTestId("track-genres")).getAllByText("Psychedelic Cumbia").length).toBeGreaterThan(0);
  });

  it("falls back to the album's Discogs styles when the track has no DJ genres at all", () => {
    renderWithProviders(
      <TrackResult track={{ ...track, track_genres: [], local_tags: "", styles: ["Bossa Nova"] }} />
    );

    expect(within(screen.getByTestId("track-genres")).getAllByText("Bossa Nova").length).toBeGreaterThan(0);
  });

  it("shows no row for a track with no genres and no Discogs styles", () => {
    renderWithProviders(<TrackResult track={{ ...track, track_genres: [], local_tags: "", styles: [] }} />);

    expect(screen.queryByTestId("track-genres")).toBeNull();
  });

  it("can be turned off for screens that don't want badges", () => {
    renderWithProviders(<TrackResult track={track} showGenres={false} />);

    expect(screen.queryByTestId("track-genres")).toBeNull();
  });

  it("folds overflow genres (beyond 2) into a +N badge instead of showing every one", () => {
    const manyGenres = {
      ...track,
      track_genres: [
        { id: "a", name: "Cumbia", slug: "cumbia", parent_id: null, parent_name: null },
        { id: "b", name: "Chicha", slug: "chicha", parent_id: null, parent_name: null },
        { id: "c", name: "Salsa", slug: "salsa", parent_id: null, parent_name: null },
        { id: "d", name: "Merengue", slug: "merengue", parent_id: null, parent_name: null },
        { id: "e", name: "Bolero", slug: "bolero", parent_id: null, parent_name: null },
      ],
    };
    renderWithProviders(<TrackResult track={manyGenres} />);

    expect(screen.getAllByText("+3").length).toBeGreaterThan(0);
  });
});

describe("TrackResult layout", () => {
  it("renders a row layout grid with a Play button for a track with audio", () => {
    renderWithProviders(<TrackResult track={{ ...track, local_audio_url: "track.m4a" }} layout="row" />);

    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  });

  it("keeps the row grid's 8 columns aligned for a track with no genres at all", () => {
    // A child that renders null (e.g. GenreList for a genre-less track) drops out of
    // the DOM, which shifts every later CSS Grid auto-placed column left by one —
    // regression coverage for that, not just a snapshot of the current markup.
    renderWithProviders(<TrackResult track={{ ...track, track_genres: [], local_tags: "", styles: [] }} layout="row" />);

    expect(screen.getByTestId("track-row-grid").children.length).toBe(8);
  });

  it("never lets the 'more actions' menu shrink out of view: it sits outside the squeezable grid", () => {
    renderWithProviders(
      <TrackResult
        track={track}
        layout="row"
        buttons={<button aria-label="Track actions">menu</button>}
      />
    );

    const grid = screen.getByTestId("track-row-grid");
    const menuButton = screen.getByRole("button", { name: "Track actions" });
    expect(grid.contains(menuButton)).toBe(false);
  });

  it("shows a 'No BPM' badge when the track has no BPM", () => {
    renderWithProviders(<TrackResult track={{ ...track, bpm: null }} />);

    expect(screen.getByText("No BPM")).toBeTruthy();
  });

  it("shows an 'Add to crate' quick action", () => {
    renderWithProviders(<TrackResult track={track} />);

    expect(screen.getByRole("button", { name: "Add to crate" })).toBeTruthy();
  });

  it("shows the sort-position-change badge when supplied", () => {
    renderWithProviders(
      <TrackResult track={track} sortPositionChange={{ currentPosition: 3, previousPosition: 1 }} />
    );

    expect(screen.getByText(/#3 was #1/)).toBeTruthy();
  });
});
