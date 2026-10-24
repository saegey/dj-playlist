// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { sampleTrack } from "@/stories/fixtures/track";
import type { Track } from "@/types/track";
import { queryKeys } from "@/lib/queryKeys";

const mocks = vi.hoisted(() => ({
  replacePlaylist: vi.fn(),
  appendToQueue: vi.fn(),
  saveTrack: vi.fn(),
}));

vi.mock("@/providers/PlaylistPlayerProvider", () => ({
  usePlaylistPlayer: () => ({ replacePlaylist: mocks.replacePlaylist, appendToQueue: mocks.appendToQueue }),
}));
vi.mock("@/hooks/useTracksQuery", () => ({ useTracksQuery: () => ({ saveTrack: mocks.saveTrack }) }));
vi.mock("./TrackPlaylistUsage", () => ({
  default: ({ count }: { count: number }) => <span>{count} playlists</span>,
}));

import TrackResult from "./TrackResult";

afterEach(() => vi.clearAllMocks());

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

  it("formats a duration over an hour as h:mm:ss", () => {
    renderWithProviders(<TrackResult track={{ ...track, duration_seconds: 3665 }} layout="row" />);

    expect(screen.getByText("1:01:05")).toBeTruthy();
  });

  it("shows an em dash for a track with no key", () => {
    renderWithProviders(<TrackResult track={{ ...track, key: null }} />);

    expect(screen.getByText("—")).toBeTruthy();
  });

  it("flags a low-confidence key with an '!' that opens a popover (#524)", async () => {
    const { user } = renderWithProviders(
      <TrackResult track={{ ...track, key: "F major", key_confidence: 0.42 }} />
    );

    await user.click(screen.getByRole("button", { name: "Uncertain key" }));

    expect(await screen.findByText(/42% confident/)).toBeTruthy();
  });

  it("does not flag a confident key as uncertain, but still shows its confidence on click (#524)", async () => {
    const { user } = renderWithProviders(
      <TrackResult track={{ ...track, key: "F major", key_confidence: 0.9 }} />
    );

    expect(screen.queryByRole("button", { name: "Uncertain key" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Key confidence" }));
    expect(await screen.findByText(/90% confident/)).toBeTruthy();
  });

  it("shows nothing clickable for a key with no confidence on record", () => {
    renderWithProviders(<TrackResult track={{ ...track, key: "F major", key_confidence: null }} />);

    expect(screen.queryByRole("button", { name: "Uncertain key" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Key confidence" })).toBeNull();
  });

  it("flags a contested BPM with an '!' that opens a popover (#531)", async () => {
    const { user } = renderWithProviders(
      <TrackResult track={{ ...track, bpm: "103", bpm_confidence: 0.02 }} />
    );

    await user.click(screen.getByRole("button", { name: "Uncertain BPM" }));

    expect(await screen.findByText(/Uncertain BPM — .* only 2% confident/)).toBeTruthy();
  });

  it("does not flag a clear BPM, but still shows its confidence on click (#531)", async () => {
    const { user } = renderWithProviders(
      <TrackResult track={{ ...track, bpm: "103", bpm_confidence: 0.26 }} />
    );

    expect(screen.queryByRole("button", { name: "Uncertain BPM" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "BPM confidence" }));
    expect(await screen.findByText(/26% confident in this BPM/)).toBeTruthy();
  });

  it("shows nothing clickable for a BPM with no confidence on record (#531)", () => {
    renderWithProviders(<TrackResult track={{ ...track, bpm: "103", bpm_confidence: null }} />);

    expect(screen.queryByRole("button", { name: "Uncertain BPM" })).toBeNull();
    expect(screen.queryByRole("button", { name: "BPM confidence" })).toBeNull();
  });

  it("shows a static image with no Play button when the track has no local audio", () => {
    renderWithProviders(<TrackResult track={{ ...track, local_audio_url: undefined }} />);

    expect(screen.queryByRole("button", { name: "Play" })).toBeNull();
  });

  it("falls back to the placeholder image when artwork fails to load, with or without audio", () => {
    // The artwork is a decorative alt="" image, so it isn't exposed via role="img".
    const { container, rerender } = renderWithProviders(
      <TrackResult track={{ ...track, local_audio_url: undefined }} />
    );
    const image = () => container.querySelector("img") as HTMLImageElement;
    fireEvent.error(image());
    expect(image().src).toContain("data:image/svg+xml");

    rerender(<TrackResult track={track} />);
    fireEvent.error(image());
    expect(image().src).toContain("data:image/svg+xml");
  });

  it("plays the track when the artwork is clicked", async () => {
    const { user } = renderWithProviders(<TrackResult track={track} />);

    await user.click(screen.getByRole("button", { name: "Play" }));

    expect(mocks.replacePlaylist).toHaveBeenCalledWith([track], { autoplay: true, startIndex: 0 });
  });

  it("adds the track to the crate when the quick-add button is clicked", async () => {
    const { user } = renderWithProviders(<TrackResult track={track} />);

    await user.click(screen.getByRole("button", { name: "Add to crate" }));

    expect(mocks.appendToQueue).toHaveBeenCalledWith(track);
  });

  it("opens the notes popover when the notes icon is clicked", async () => {
    const { user } = renderWithProviders(
      <TrackResult track={{ ...track, notes: "Great transition into this one" }} />
    );

    await user.click(screen.getByRole("button", { name: "Has notes" }));

    expect(await screen.findByText("Great transition into this one")).toBeTruthy();
  });

  it("saves a new rating when a star is clicked", async () => {
    const { user } = renderWithProviders(<TrackResult track={{ ...track, star_rating: 0 }} />);

    await user.click(screen.getByRole("radio", { name: "4 stars" }));

    expect(mocks.saveTrack).toHaveBeenCalledWith({
      track_id: track.track_id,
      friend_id: track.friend_id,
      star_rating: 4,
    });
  });

  it("shows the library identifier badge", () => {
    renderWithProviders(<TrackResult track={{ ...track, library_identifier: "LP-099" }} />);

    expect(screen.getByText("LP-099")).toBeTruthy();
  });

  it("shows the playlist count badge when there is one", () => {
    renderWithProviders(<TrackResult track={track} playlistCount={3} />);

    expect(screen.getByText("3 playlists")).toBeTruthy();
  });

  it.each(["row", "card"] as const)(
    "shows a checkbox and reports selection in %s layout",
    async (layout) => {
      const onToggleSelect = vi.fn();
      const { user } = renderWithProviders(
        <TrackResult track={track} layout={layout} isSelected={false} onToggleSelect={onToggleSelect} />
      );

      await user.click(screen.getByRole("checkbox"));

      expect(onToggleSelect).toHaveBeenCalledTimes(1);
    }
  );
});

describe("TrackResult dense layouts", () => {
  it("renders dense card links, genre sources, playlist usage, notes, footer and actions", async () => {
    const denseTrack = {
      ...track,
      genres: ["Source"],
      styles: ["Source Style"],
      album_genres: ["Jazz"],
      album_styles: [],
      track_genres: [{ id: "c", name: "Cumbia", slug: "cumbia", parent_id: null, parent_name: null }],
      notes: "Dense card note",
      release_id: "release-1",
      username: "crate-owner",
    } as Track;
    const { user, queryClient } = renderWithProviders(
      <TrackResult
        track={denseTrack}
        density="dense"
        playlistCount={2}
        footer={<span>Job footer</span>}
        buttons={<button aria-label="Job details">Details</button>}
      />
    );
    await act(async () => {
      queryClient.setQueryData(queryKeys.genreTree(), [
        { id: "j", name: "Jazz", slug: "jazz", parent_id: null, source: "discogs", track_count: 0, album_count: 0, children: [] },
        { id: "c", name: "Cumbia", slug: "cumbia", parent_id: null, source: "discogs", track_count: 0, album_count: 0, children: [] },
      ]);
    });

    expect(screen.getByTestId("track-result-dense-card")).toBeTruthy();
    expect(screen.getByRole("link", { name: denseTrack.title }).getAttribute("href")).toBe(`/tracks/${denseTrack.track_id}?friend_id=${denseTrack.friend_id}`);
    expect(screen.getByRole("link", { name: denseTrack.artist }).getAttribute("href")).toBe(`/albums?q=${encodeURIComponent(denseTrack.artist)}&friend_id=${denseTrack.friend_id}`);
    expect((await screen.findByRole("link", { name: "Search tracks in Jazz" })).getAttribute("href")).toBe("/?genre=jazz");
    expect((await screen.findByRole("link", { name: "Search tracks in Cumbia" })).getAttribute("href")).toBe("/?genre=cumbia");
    expect(screen.getByText("2 playlists")).toBeTruthy();
    expect(screen.getByText("crate-owner")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Has notes" })).toBeTruthy();
    expect(screen.getByText("Job footer")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Job details" })).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(mocks.saveTrack).toHaveBeenCalledWith({
      track_id: denseTrack.track_id,
      friend_id: denseTrack.friend_id,
      star_rating: 4,
    });
  });

  it("honors dense card field visibility and reports selection", async () => {
    const onToggleSelect = vi.fn();
    const { user } = renderWithProviders(
      <TrackResult
        track={{ ...track, username: "private", notes: "hidden note", star_rating: 0 }}
        density="dense"
        showUsername={false}
        showRating={false}
        showDetails={false}
        showGenres={false}
        showNotes={false}
        showPlaylistCount={false}
        playlistCount={3}
        isSelected
        onToggleSelect={onToggleSelect}
      />
    );

    expect(screen.queryByText("private")).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByTestId("track-genres")).toBeNull();
    expect(screen.queryByRole("button", { name: "Has notes" })).toBeNull();
    expect(screen.queryByText("3 playlists")).toBeNull();
    expect(screen.getByRole("checkbox")).toBeTruthy();
    await user.click(screen.getByRole("checkbox"));
    expect(onToggleSelect).toHaveBeenCalledTimes(1);
  });

  it("preserves queue row clicks while links and nested actions remain independent", async () => {
    const onRowClick = vi.fn();
    const onRemove = vi.fn();
    const onToggleSelect = vi.fn();
    const { user } = renderWithProviders(
      <TrackResult
        track={{ ...track, local_audio_url: "track.m4a" }}
        density="dense"
        layout="row"
        onRowClick={onRowClick}
        isSelected={false}
        onToggleSelect={onToggleSelect}
        showRating={false}
        buttons={<button aria-label="Remove track" onClick={onRemove}>Remove</button>}
      />
    );
    const row = screen.getByTestId("track-result-dense-row");

    await user.click(row);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("link", { name: track.title }));
    expect(onRowClick).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByRole("link", { name: track.title }), { key: "Enter" });
    expect(onRowClick).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Remove track" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("checkbox"));
    expect(onToggleSelect).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    row.focus();
    await user.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(row, { key: " " });
    expect(onRowClick).toHaveBeenCalledTimes(3);
  });

  it("plays dense-row artwork without triggering row playback", async () => {
    const onRowClick = vi.fn();
    const playableTrack = { ...track, local_audio_url: "track.m4a" };
    const { user } = renderWithProviders(
      <TrackResult
        track={playableTrack}
        density="dense"
        layout="row"
        onRowClick={onRowClick}
        playlistCount={2}
      />
    );

    expect(screen.getByText("2 playlists")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(mocks.replacePlaylist).toHaveBeenCalledWith(
      [playableTrack],
      { autoplay: true, startIndex: 0 }
    );
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("honors dense row visibility controls for genres, rating, username, usage and duration", () => {
    renderWithProviders(
      <TrackResult
        track={{ ...track, username: "hidden user", notes: "hidden note" }}
        density="dense"
        layout="row"
        showUsername={false}
        showRating={false}
        showDetails={false}
        showGenres={false}
        showNotes={false}
        showPlaylistCount={false}
        playlistCount={4}
      />
    );

    expect(screen.queryByText("hidden user")).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByTestId("track-genres")).toBeNull();
    expect(screen.queryByRole("button", { name: "Has notes" })).toBeNull();
    expect(screen.queryByText("4 playlists")).toBeNull();
    expect(screen.queryByText("2:28")).toBeNull();
  });

  it("keeps the dense row genre slot empty when there are no genre values", () => {
    renderWithProviders(
      <TrackResult
        track={{ ...track, genres: [], styles: [], track_genres: [], local_tags: "" }}
        density="dense"
        layout="row"
      />
    );

    expect(screen.queryByTestId("track-genres")).toBeNull();
  });

  it("keeps unreconciled local tags visible as plain text in the dense card", () => {
    renderWithProviders(
      <TrackResult
        track={{ ...track, track_genres: [], local_tags: "Feminist Anthem", genres: [], styles: [] }}
        density="dense"
      />
    );

    expect(screen.getByText("Feminist Anthem").closest("a")).toBeNull();
  });

  it.each([
    { score: 0.93, label: "93%" },
    { score: 0.8, label: "80%" },
    { score: 0.7, label: "70%" },
  ])("preserves the dense-card similarity score band for $label", ({ score, label }) => {
    renderWithProviders(<TrackResult track={{ ...track, _semanticScore: score }} density="dense" />);
    expect(screen.getByText(label)).toBeTruthy();
  });

  it("shows a dense-card album without a year when the year is missing", () => {
    renderWithProviders(<TrackResult track={{ ...track, year: "" }} density="dense" />);
    expect(screen.getByRole("link", { name: track.album }).textContent).toBe(track.album);
  });

  it("shows queue duration and uses the placeholder when dense-row artwork fails", () => {
    const { container } = renderWithProviders(
      <TrackResult track={{ ...track, local_audio_url: undefined }} density="dense" layout="row" />
    );
    expect(screen.getByText("2:28")).toBeTruthy();
    const image = container.querySelector("img") as HTMLImageElement;
    fireEvent.error(image);
    expect(image.src).toContain("data:image/svg+xml");
  });
});

describe("TrackResult state styling across layouts", () => {
  const layouts = [
    ["card", {}],
    ["dense card", { density: "dense" as const }],
    ["row", { layout: "row" as const }],
    ["dense row", { density: "dense" as const, layout: "row" as const }],
  ] as const;

  it.each(layouts)("renders selected, data-issue and score states in the %s layout", (_name, props) => {
    const noBpm = { ...track, bpm: undefined, hasVectors: false } as unknown as Track;
    for (const [score, label] of [[0.95, "95"], [0.8, "80"], [0.5, "50"]] as const) {
      const { unmount } = renderWithProviders(
        <TrackResult
          track={{ ...noBpm, _semanticScore: score } as Track}
          isSelected
          onToggleSelect={vi.fn()}
          {...props}
        />
      );
      // The dense row has no room for a score badge.
      if (_name !== "dense row") {
        expect(screen.getAllByText(new RegExp(`^${label}(\\.0)?%$`)).length).toBeGreaterThan(0);
      }
      unmount();
    }

    const healthy = { ...track, bpm: "120", hasVectors: true } as Track;
    for (const isSelected of [true, false]) {
      const { unmount } = renderWithProviders(
        <TrackResult track={healthy} isSelected={isSelected} onToggleSelect={vi.fn()} {...props} />
      );
      expect(screen.getAllByText(track.title).length).toBeGreaterThan(0);
      unmount();
    }
  });
});
