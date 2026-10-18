// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock("@/hooks/useBackupsQuery", () => ({
  useBackupsQuery: () => ({ addBackup: { mutate: mocks.mutate, isPending: false }, addBackupLoading: false }),
}));

import ActionsGrid from "./ActionsGrid";

describe("ActionsGrid", () => {
  it("offers Backup Database but no Discogs sync", async () => {
    const { user } = renderWithProviders(<ActionsGrid />);
    expect(screen.getByText("Settings")).toBeTruthy();
    await user.click(screen.getByRole("button", { hidden: true }));

    await user.click(await screen.findByText("Backup Database"));
    expect(mocks.mutate).toHaveBeenCalled();
    const callbacks = mocks.mutate.mock.calls[0][1];
    callbacks.onSuccess({ message: "done" });
    callbacks.onError(new Error("boom"));
    expect(screen.queryByText("Sync Discogs")).toBeNull();
  });

  it("can hide the title", () => {
    renderWithProviders(<ActionsGrid showTitle={false} />);
    expect(screen.queryByText("Settings")).toBeNull();
  });
});
