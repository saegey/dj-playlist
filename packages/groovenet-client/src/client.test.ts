import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.hoisted(() => vi.fn());
const createMock = vi.hoisted(() => vi.fn(() => ({ request: requestMock })));

vi.mock("axios", () => ({
  default: {
    create: createMock,
    isAxiosError: () => false,
  },
}));

import { GroovenetClient } from "./client.js";

describe("GroovenetClient.batchGetTracks", () => {
  beforeEach(() => {
    createMock.mockClear();
    requestMock.mockReset();
    requestMock.mockResolvedValue({ data: [] });
  });

  it("omits include_vectors by default", async () => {
    const client = new GroovenetClient({ baseUrl: "https://example.test" });
    const refs = [{ track_id: "t1", friend_id: 1 }];

    await client.batchGetTracks(refs);

    expect(requestMock).toHaveBeenCalledWith({
      method: "POST",
      url: "/tracks/batch",
      data: { tracks: refs },
      params: undefined,
    });
  });

  it("includes include_vectors when requested", async () => {
    const client = new GroovenetClient({ baseUrl: "https://example.test" });
    const refs = [{ track_id: "t1", friend_id: 1 }];

    await client.batchGetTracks(refs, { include_vectors: true });

    expect(requestMock).toHaveBeenCalledWith({
      method: "POST",
      url: "/tracks/batch",
      data: { tracks: refs, include_vectors: true },
      params: undefined,
    });
  });
});
