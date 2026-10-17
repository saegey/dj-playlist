// @vitest-environment jsdom
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const api = vi.hoisted(() => ({
  searchAlbums: vi.fn(),
  getAlbumWithTracks: vi.fn(),
  updateAlbum: vi.fn(),
  deleteAlbum: vi.fn(),
}));
vi.mock("@/services/internalApi/albums", () => api);

import { useDeleteAlbumMutation } from "./useAlbumsQuery";

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const removeQueries = vi.spyOn(client, "removeQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidate, removeQueries };
}

beforeEach(() => vi.resetAllMocks());

describe("useDeleteAlbumMutation (#511)", () => {
  it("deletes the album, then invalidates the list and drops the detail query", async () => {
    api.deleteAlbum.mockResolvedValue({ success: true });
    const { wrapper, invalidate, removeQueries } = setup();

    const { result } = renderHook(() => useDeleteAlbumMutation(), { wrapper });
    result.current.mutate({ releaseId: "r1", friendId: 7 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.deleteAlbum).toHaveBeenCalledWith("r1", 7);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["albums"] });
    expect(removeQueries).toHaveBeenCalledWith({ queryKey: ["album", "r1", 7] });
  });

  it("surfaces a failure without touching the cache", async () => {
    api.deleteAlbum.mockRejectedValue(new Error("boom"));
    const { wrapper, invalidate, removeQueries } = setup();

    const { result } = renderHook(() => useDeleteAlbumMutation(), { wrapper });
    result.current.mutate({ releaseId: "r1", friendId: 7 });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidate).not.toHaveBeenCalled();
    expect(removeQueries).not.toHaveBeenCalled();
  });
});
