// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { sampleTrack, trackInPlaylist } from "@/stories/fixtures/track";
import DraggableTrackList from "./DraggableTrackList";

vi.mock("@/providers/PlaylistPlayerProvider", () => ({
  usePlaylistPlayer: () => ({ replacePlaylist: vi.fn(), appendToQueue: vi.fn() }),
}));
vi.mock("@/hooks/useTracksQuery", () => ({ useTracksQuery: () => ({ saveTrack: vi.fn() }) }));

describe("DraggableTrackList dense rows", () => {
  it("forwards the dense row layout and associates row clicks with the playlist index", () => {
    const onRowClick = vi.fn();
    renderWithProviders(
      <DraggableTrackList
        tracksPlaylist={[
          { track_id: sampleTrack.track_id, friend_id: sampleTrack.friend_id! },
          { track_id: trackInPlaylist.track_id, friend_id: trackInPlaylist.friend_id! },
        ]}
        tracks={[sampleTrack, trackInPlaylist]}
        moveTrack={vi.fn()}
        droppableId="queue-test"
        currentTrackIndex={1}
        trackResultProps={{
          density: "dense",
          layout: "row",
          onRowClick,
        }}
      />
    );

    const rows = screen.getAllByTestId("track-result-dense-row");
    expect(rows).toHaveLength(2);
    expect(rows[1].closest("[data-rfd-drag-handle-draggable-id]")).toBeTruthy();
    fireEvent.click(rows[1]);
    expect(onRowClick).toHaveBeenCalledWith(trackInPlaylist, 1);
  });
});
