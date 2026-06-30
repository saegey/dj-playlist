import { beforeEach, describe, expect, it, vi } from "vitest";

const httpMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/http", () => ({
  http: httpMock,
}));

import { fetchTracksByIds } from "./tracks";

describe("fetchTracksByIds", () => {
  beforeEach(() => {
    httpMock.mockReset();
    httpMock.mockResolvedValue([]);
  });

  it("returns early for an empty track list", async () => {
    await expect(fetchTracksByIds([])).resolves.toEqual([]);
    expect(httpMock).not.toHaveBeenCalled();
  });

  it("omits include_vectors by default", async () => {
    const refs = [{ track_id: "t1", friend_id: 1 }];

    await fetchTracksByIds(refs);

    expect(httpMock).toHaveBeenCalledWith("/api/tracks/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracks: refs }),
    });
  });

  it("includes include_vectors when requested", async () => {
    const refs = [{ track_id: "t1", friend_id: 1 }];

    await fetchTracksByIds(refs, { includeVectors: true });

    expect(httpMock).toHaveBeenCalledWith("/api/tracks/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracks: refs, include_vectors: true }),
    });
  });
});
