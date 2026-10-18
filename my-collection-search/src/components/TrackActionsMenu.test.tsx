// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { chooseMenuItem, renderWithProviders } from "@/test/renderWithProviders";
import type { Track } from "@/types/track";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  appendToQueue: vi.fn(),
  replacePlaylist: vi.fn(),
  openForTrack: vi.fn(),
  mutateAsync: vi.fn(),
  analyzeTrackAsync: vi.fn().mockResolvedValue({ jobId: "job1" }),
  saveTrack: vi.fn().mockResolvedValue({}),
  softDeleteTrack: vi.fn().mockResolvedValue({}),
  toast: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/providers/PlaylistPlayerProvider", () => ({
  usePlaylistPlayer: () => ({
    appendToQueue: mocks.appendToQueue,
    replacePlaylist: mocks.replacePlaylist,
  }),
}));
vi.mock("@/hooks/useAddToPlaylistDialog", () => ({
  useAddToPlaylistDialog: () => ({
    openForTrack: mocks.openForTrack,
    playlistDialog: null,
    nameDialog: null,
  }),
}));
vi.mock("@/hooks/useUploadTrackAudioMutation", () => ({
  useUploadTrackAudioMutation: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));
vi.mock("@/services/internalApi/tracks", () => ({
  analyzeTrackAsync: mocks.analyzeTrackAsync,
  saveTrack: mocks.saveTrack,
  softDeleteTrack: mocks.softDeleteTrack,
}));
vi.mock("@/components/ui/toaster", () => ({ toaster: { create: mocks.toast } }));

import TrackActionsMenu from "./TrackActionsMenu";

afterEach(() => vi.clearAllMocks());

const trackWithEverything = {
  track_id: "t1",
  friend_id: 7,
  title: "Full House",
  artist: "DJ Test",
  local_audio_url: "t1.m4a",
  apple_music_url: "https://music.apple.com/x",
  youtube_url: "https://youtube.com/x",
  soundcloud_url: "https://soundcloud.com/x",
} as Track;

const trackMinimal = {
  track_id: "t2",
  friend_id: 7,
  title: "Bare",
  artist: "DJ Test",
} as Track;

function setup(
  track: Track = trackWithEverything,
  props: Partial<React.ComponentProps<typeof TrackActionsMenu>> = {}
) {
  const rendered = renderWithProviders(<TrackActionsMenu track={track} {...props} />);
  const menuButton = screen.getAllByRole("button", { name: "Track actions", hidden: true })[1];
  return { ...rendered, menuButton };
}

describe("TrackActionsMenu desktop dropdown — conditional items", () => {
  it("shows Play and Remove Audio only when the track has local audio", async () => {
    const { user, menuButton } = setup(trackWithEverything);
    await user.click(menuButton);
    expect(await screen.findByRole("menuitem", { name: /^Play$/, hidden: true })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Remove Audio/, hidden: true })).toBeTruthy();
  });

  it("hides Play and Remove Audio without local audio, but still offers Fetch Audio with a streaming link", async () => {
    const { user, menuButton } = setup({
      ...trackMinimal,
      apple_music_url: "https://music.apple.com/x",
    });
    await user.click(menuButton);
    await screen.findByRole("menuitem", { name: /Add to Playlist/, hidden: true });
    expect(screen.queryByRole("menuitem", { name: /^Play$/, hidden: true })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /Remove Audio/, hidden: true })).toBeNull();
    expect(screen.getByRole("menuitem", { name: /Fetch Audio/, hidden: true })).toBeTruthy();
  });

  it("omits Fetch Audio and streaming links without any streaming URL", async () => {
    const { user, menuButton } = setup({ ...trackMinimal, local_audio_url: "t2.m4a" });
    await user.click(menuButton);
    await screen.findByRole("menuitem", { name: /Delete Track/, hidden: true });
    expect(screen.queryByRole("menuitem", { name: /Fetch Audio/, hidden: true })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /Apple Music/, hidden: true })).toBeNull();
  });

  it("lists only the streaming links the track actually has", async () => {
    const { user, menuButton } = setup({
      ...trackMinimal,
      apple_music_url: "https://music.apple.com/x",
    });
    await user.click(menuButton);
    expect(await screen.findByRole("menuitem", { name: /Apple Music/, hidden: true })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: /YouTube/, hidden: true })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /SoundCloud/, hidden: true })).toBeNull();
  });

  it("hides Edit Track when hideEdit is set, and Track Debug without a handler", async () => {
    const { user, menuButton } = setup(trackWithEverything, { hideEdit: true });
    await user.click(menuButton);
    await screen.findByRole("menuitem", { name: /Add to Playlist/, hidden: true });
    expect(screen.queryByRole("menuitem", { name: /Edit Track/, hidden: true })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /Track Debug/, hidden: true })).toBeNull();
  });

  it("offers Track Debug when a handler is given", async () => {
    const { user, menuButton } = setup(trackWithEverything, { onOpenTrackDebug: vi.fn() });
    await user.click(menuButton);
    expect(await screen.findByRole("menuitem", { name: /Track Debug/, hidden: true })).toBeTruthy();
  });
});

describe("TrackActionsMenu desktop dropdown — selecting an item", () => {
  it("plays the track", async () => {
    const { user, menuButton } = setup(trackWithEverything);
    await chooseMenuItem(user, menuButton, /^Play$/);
    expect(mocks.replacePlaylist).toHaveBeenCalledWith([trackWithEverything], {
      autoplay: true,
      startIndex: 0,
    });
  });

  it("opens the add-to-playlist dialog", async () => {
    const { user, menuButton } = setup(trackWithEverything);
    await chooseMenuItem(user, menuButton, /Add to Playlist/);
    expect(mocks.openForTrack).toHaveBeenCalledWith(trackWithEverything);
  });

  it("queues enrichment and navigates to /enrich", async () => {
    const { user, menuButton } = setup(trackWithEverything);
    await chooseMenuItem(user, menuButton, /Enrich Track/);
    expect(mocks.push).toHaveBeenCalledWith("/enrich");
  });

  it("adds the track to the play queue", async () => {
    const { user, menuButton } = setup(trackWithEverything);
    await chooseMenuItem(user, menuButton, /Add to Queue/);
    expect(mocks.appendToQueue).toHaveBeenCalledWith(trackWithEverything);
  });

  it("fetches audio from streaming links", async () => {
    const { user, menuButton } = setup(trackWithEverything);
    await chooseMenuItem(user, menuButton, /Fetch Audio/);
    expect(mocks.analyzeTrackAsync).toHaveBeenCalledWith(
      expect.objectContaining({ track_id: "t1", friend_id: 7 })
    );
  });

  it("opens the remove-audio confirmation", async () => {
    const { user, menuButton } = setup(trackWithEverything);
    await chooseMenuItem(user, menuButton, /Remove Audio/);
    expect(await screen.findByRole("dialog", { name: "Remove Audio" })).toBeTruthy();
  });

  it("opens the delete-track confirmation", async () => {
    const { user, menuButton } = setup(trackWithEverything);
    await chooseMenuItem(user, menuButton, /Delete Track/);
    expect(await screen.findByRole("dialog", { name: "Delete track?" })).toBeTruthy();
  });
});

describe("TrackActionsMenu desktop dropdown — grouping", () => {
  it("orders primary, audio, destructive (adjacent) and external-link groups", async () => {
    const { user, menuButton } = setup(trackWithEverything, {
      onOpenTrackDebug: vi.fn(),
      onChangeArtwork: vi.fn(),
    });
    await user.click(menuButton);
    await screen.findByRole("menuitem", { name: /^Play$/, hidden: true });
    const names = screen
      .getAllByRole("menuitem", { hidden: true })
      .map((el) => el.textContent?.trim());
    expect(names).toEqual([
      "Play",
      "Add to Queue",
      "Add to Playlist",
      "Edit Track",
      "Enrich Track",
      "Cover Art...",
      "Track Debug",
      "Fetch Audio",
      "Upload Audio",
      "Remove Audio",
      "Delete Track",
      "Apple Music",
      "YouTube",
      "SoundCloud",
    ]);
  });
});
