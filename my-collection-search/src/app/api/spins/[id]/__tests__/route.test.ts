import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDeleteSpinSession = vi.hoisted(() => vi.fn());

vi.mock("@/server/services/spinLoggingService", () => ({
  spinLoggingService: {
    deleteSpinSession: mockDeleteSpinSession,
  },
}));

import { DELETE } from "../route";

describe("DELETE /api/spins/{id}", () => {
  beforeEach(() => {
    mockDeleteSpinSession.mockReset();
  });

  it("returns 400 for invalid path params", async () => {
    const req = new Request("http://localhost/api/spins/not-a-number?friend_id=1", {
      method: "DELETE",
    });

    const res = await DELETE(req as never, {
      params: Promise.resolve({ id: "not-a-number" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid query params", async () => {
    const req = new Request("http://localhost/api/spins/10?friend_id=nope", {
      method: "DELETE",
    });

    const res = await DELETE(req as never, {
      params: Promise.resolve({ id: "10" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 404 when session is not found", async () => {
    mockDeleteSpinSession.mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/spins/10?friend_id=1", {
      method: "DELETE",
    });

    const res = await DELETE(req as never, {
      params: Promise.resolve({ id: "10" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns deleted session payload on success", async () => {
    mockDeleteSpinSession.mockResolvedValueOnce({
      id: 10,
      friend_id: 1,
      release_id: "rel-1",
      medium: "vinyl",
      selection_mode: "tracks",
      played_at: "2026-06-24T02:00:00.000Z",
      note: null,
      context_type: null,
      created_at: "2026-06-24T02:00:00.000Z",
      updated_at: "2026-06-24T02:00:00.000Z",
    });

    const req = new Request("http://localhost/api/spins/10?friend_id=1", {
      method: "DELETE",
    });

    const res = await DELETE(req as never, {
      params: Promise.resolve({ id: "10" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.session.id).toBe(10);
    expect(mockDeleteSpinSession).toHaveBeenCalledWith(10, 1);
  });
});
