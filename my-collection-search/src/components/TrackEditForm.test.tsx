// @vitest-environment jsdom
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { TrackGenre } from "@/types/track";

const fetchGenreTree = vi.hoisted(() => vi.fn());
vi.mock("@/services/internalApi/genres", () => ({ fetchGenreTree }));
vi.mock("@/providers/PlaylistPlayerProvider", () => ({
  usePlaylistPlayer: () => ({ playlistLength: 0 }),
}));
vi.mock("@/components/track-edit/useTrackEditAudioActions", () => ({
  useTrackEditAudioActions: () => ({}),
}));

import TrackEditForm from "./TrackEditForm";
import type { TrackEditFormProps } from "@/components/track-edit/types";

const CUMBIA: TrackGenre = { id: "cumbia", name: "Cumbia", slug: "cumbia", parent_id: "latin", parent_name: "Latin" };
const TRACK: TrackEditFormProps = {
  track_id: "t1",
  friend_id: 1,
  title: "Cumbia del Sol",
  local_tags: "Psychedelic Cumbia",
  track_genres: [CUMBIA],
};

function renderForm(onSave = vi.fn(), track: TrackEditFormProps = TRACK) {
  const result = renderWithProviders(
    <TrackEditForm
      track={track}
      onSave={onSave}
      dialogOpen
      setDialogOpen={vi.fn()}
      initialFocusRef={React.createRef()}
    />
  );
  return { ...result, onSave };
}

describe("TrackEditForm genres", () => {
  beforeEach(() => {
    fetchGenreTree.mockReset();
    fetchGenreTree.mockResolvedValue([]);
  });

  it("saves without a genres field when the genres were left alone", async () => {
    const { user, onSave } = renderForm();

    await user.click(screen.getAllByRole("button", { name: "Save", hidden: true })[0]);

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("genres");
  });

  it("sends the edited genre ids when a genre is removed", async () => {
    const { user, onSave } = renderForm();

    await user.click(screen.getByRole("button", { name: "Remove Cumbia", hidden: true }));
    await user.click(screen.getAllByRole("button", { name: "Save", hidden: true })[0]);

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0][0]).toMatchObject({ track_id: "t1", genres: [], track_genres: [] });
  });
});

describe("TrackEditForm key confidence (#524)", () => {
  beforeEach(() => {
    fetchGenreTree.mockReset();
    fetchGenreTree.mockResolvedValue([]);
  });

  it("flags a low-confidence key as uncertain", () => {
    renderForm(vi.fn(), { ...TRACK, key: "F major", key_confidence: 0.42 });

    expect(screen.getByText("Uncertain key")).toBeTruthy();
  });

  it("does not flag a confident key", () => {
    renderForm(vi.fn(), { ...TRACK, key: "F major", key_confidence: 0.9 });

    expect(screen.queryByText("Uncertain key")).toBeNull();
  });

  it("does not flag a key with no confidence on record", () => {
    renderForm(vi.fn(), { ...TRACK, key: "F major" });

    expect(screen.queryByText("Uncertain key")).toBeNull();
  });
});
