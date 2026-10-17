// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, setViewportWidth } from "@/test/renderWithProviders";

import AlbumActionsMenu from "./AlbumActionsMenu";

afterEach(() => setViewportWidth(1280));

describe("AlbumActionsMenu delete action (#511)", () => {
  it("omits the delete item when no handler is given (desktop menu)", async () => {
    const { user } = renderWithProviders(<AlbumActionsMenu />);
    await user.click(screen.getByRole("button", { name: "Album actions" }));
    expect(screen.queryByText("Delete Album...")).toBeNull();
  });

  it("fires onDeleteAlbum from the desktop menu", async () => {
    const onDeleteAlbum = vi.fn();
    const { user } = renderWithProviders(<AlbumActionsMenu onDeleteAlbum={onDeleteAlbum} />);

    await user.click(screen.getByRole("button", { name: "Album actions" }));
    await user.click(screen.getByText("Delete Album..."));

    expect(onDeleteAlbum).toHaveBeenCalled();
  });

  it("fires onDeleteAlbum from the mobile drawer and closes it", async () => {
    setViewportWidth(400);
    const onDeleteAlbum = vi.fn();
    const { user } = renderWithProviders(<AlbumActionsMenu onDeleteAlbum={onDeleteAlbum} />);

    await user.click(screen.getByRole("button", { name: "Album actions" }));
    await user.click(screen.getByText("Delete Album..."));

    expect(onDeleteAlbum).toHaveBeenCalled();
  });
});
