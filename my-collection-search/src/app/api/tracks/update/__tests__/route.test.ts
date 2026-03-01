import { vi, describe, it, expect, beforeEach } from "vitest";

const {
  mockFindTrack,
  mockUpdateTrack,
  mockUpdateEmbedding,
  mockGetTrackEmbedding,
  mockMeiliUpdate,
  mockPostHogCapture,
} = vi.hoisted(() => {
  const mockMeiliUpdate = vi.fn().mockResolvedValue(undefined);
  return {
    mockFindTrack: vi.fn(),
    mockUpdateTrack: vi.fn(),
    mockUpdateEmbedding: vi.fn().mockResolvedValue(undefined),
    mockGetTrackEmbedding: vi.fn().mockResolvedValue([0.1, 0.2]),
    mockMeiliUpdate,
    mockPostHogCapture: vi.fn(),
  };
});

vi.mock("@/server/repositories/trackRepository", () => ({
  trackRepository: {
    findTrackByTrackIdAndFriendId: mockFindTrack,
    updateTrackFields: mockUpdateTrack,
    updateTrackEmbedding: mockUpdateEmbedding,
  },
}));

vi.mock("@/lib/track-embedding", () => ({
  getTrackEmbedding: mockGetTrackEmbedding,
}));

vi.mock("@/lib/meili", () => ({
  getMeiliClient: () => ({
    index: () => ({ updateDocuments: mockMeiliUpdate }),
  }),
}));

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({ capture: mockPostHogCapture }),
}));

import { PATCH } from "../route";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(body: unknown) {
  return new Request("http://localhost/api/tracks/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function baseTrack(overrides: Record<string, unknown> = {}) {
  return {
    track_id: "t1",
    friend_id: 1,
    title: "Test Track",
    artist: "Test Artist",
    bpm: 120,
    key: "A minor",
    danceability: 0.8,
    mood_happy: 0.5,
    notes: "",
    local_tags: "",
    styles: ["Deep House"],
    genres: ["Electronic"],
    star_rating: 3,
    ...overrides,
  };
}

const PATCH_BODY = { track_id: "t1", friend_id: 1 };

beforeEach(() => {
  mockFindTrack.mockReset();
  mockUpdateTrack.mockReset();
  mockUpdateEmbedding.mockReset();
  mockGetTrackEmbedding.mockReset();
  mockMeiliUpdate.mockReset();
  mockPostHogCapture.mockReset();

  mockUpdateEmbedding.mockResolvedValue(undefined);
  mockGetTrackEmbedding.mockResolvedValue([0.1, 0.2]);
  mockMeiliUpdate.mockResolvedValue(undefined);
});

// ─── Track not found ──────────────────────────────────────────────────────────

describe("PATCH /api/tracks/update — track not found", () => {
  it("returns 404 when updateTrackFields returns null", async () => {
    mockFindTrack.mockResolvedValueOnce(baseTrack());
    mockUpdateTrack.mockResolvedValueOnce(null);
    const res = await PATCH(makeReq(PATCH_BODY));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });
});

// ─── shouldUpdateEmbedding — scalar fields ────────────────────────────────────

describe("PATCH /api/tracks/update — embedding update (scalar fields)", () => {
  it("regenerates embedding when bpm changes", async () => {
    mockFindTrack.mockResolvedValueOnce(baseTrack({ bpm: 120 }));
    mockUpdateTrack.mockResolvedValueOnce(baseTrack({ bpm: 130 }));
    await PATCH(makeReq(PATCH_BODY));
    expect(mockGetTrackEmbedding).toHaveBeenCalledOnce();
    expect(mockUpdateEmbedding).toHaveBeenCalledOnce();
  });

  it("regenerates embedding when key changes", async () => {
    mockFindTrack.mockResolvedValueOnce(baseTrack({ key: "A minor" }));
    mockUpdateTrack.mockResolvedValueOnce(baseTrack({ key: "C major" }));
    await PATCH(makeReq(PATCH_BODY));
    expect(mockGetTrackEmbedding).toHaveBeenCalledOnce();
  });

  it("regenerates embedding when notes changes", async () => {
    mockFindTrack.mockResolvedValueOnce(baseTrack({ notes: "" }));
    mockUpdateTrack.mockResolvedValueOnce(baseTrack({ notes: "Great track" }));
    await PATCH(makeReq(PATCH_BODY));
    expect(mockGetTrackEmbedding).toHaveBeenCalledOnce();
  });

  it("regenerates embedding when danceability changes", async () => {
    mockFindTrack.mockResolvedValueOnce(baseTrack({ danceability: 0.5 }));
    mockUpdateTrack.mockResolvedValueOnce(baseTrack({ danceability: 0.9 }));
    await PATCH(makeReq(PATCH_BODY));
    expect(mockGetTrackEmbedding).toHaveBeenCalledOnce();
  });

  it("does NOT regenerate embedding when only star_rating changes", async () => {
    const current = baseTrack({ star_rating: 3 });
    const updated = baseTrack({ star_rating: 5 });
    mockFindTrack.mockResolvedValueOnce(current);
    mockUpdateTrack.mockResolvedValueOnce(updated);
    await PATCH(makeReq(PATCH_BODY));
    expect(mockGetTrackEmbedding).not.toHaveBeenCalled();
    expect(mockUpdateEmbedding).not.toHaveBeenCalled();
  });

  it("does NOT regenerate embedding when only title changes", async () => {
    mockFindTrack.mockResolvedValueOnce(baseTrack({ title: "Old Title" }));
    mockUpdateTrack.mockResolvedValueOnce(baseTrack({ title: "New Title" }));
    await PATCH(makeReq(PATCH_BODY));
    expect(mockGetTrackEmbedding).not.toHaveBeenCalled();
  });
});

// ─── shouldUpdateEmbedding — array fields ─────────────────────────────────────

describe("PATCH /api/tracks/update — embedding update (array fields)", () => {
  it("regenerates embedding when styles array changes", async () => {
    mockFindTrack.mockResolvedValueOnce(baseTrack({ styles: ["Deep House"] }));
    mockUpdateTrack.mockResolvedValueOnce(baseTrack({ styles: ["Tech House"] }));
    await PATCH(makeReq(PATCH_BODY));
    expect(mockGetTrackEmbedding).toHaveBeenCalledOnce();
  });

  it("regenerates embedding when genres array changes", async () => {
    mockFindTrack.mockResolvedValueOnce(baseTrack({ genres: ["Electronic"] }));
    mockUpdateTrack.mockResolvedValueOnce(baseTrack({ genres: ["House"] }));
    await PATCH(makeReq(PATCH_BODY));
    expect(mockGetTrackEmbedding).toHaveBeenCalledOnce();
  });

  it("does NOT regenerate embedding when array content is identical", async () => {
    mockFindTrack.mockResolvedValueOnce(baseTrack({ styles: ["Deep House", "Tech House"] }));
    mockUpdateTrack.mockResolvedValueOnce(baseTrack({ styles: ["Deep House", "Tech House"] }));
    await PATCH(makeReq(PATCH_BODY));
    expect(mockGetTrackEmbedding).not.toHaveBeenCalled();
  });

  it("regenerates embedding when local_tags changes", async () => {
    mockFindTrack.mockResolvedValueOnce(baseTrack({ local_tags: "crate1" }));
    mockUpdateTrack.mockResolvedValueOnce(baseTrack({ local_tags: "crate1,crate2" }));
    await PATCH(makeReq(PATCH_BODY));
    expect(mockGetTrackEmbedding).toHaveBeenCalledOnce();
  });
});

// ─── MeiliSearch update ───────────────────────────────────────────────────────

describe("PATCH /api/tracks/update — MeiliSearch update", () => {
  it("always calls MeiliSearch updateDocuments even when embedding does not change", async () => {
    mockFindTrack.mockResolvedValueOnce(baseTrack({ star_rating: 3 }));
    mockUpdateTrack.mockResolvedValueOnce(baseTrack({ star_rating: 5 }));
    await PATCH(makeReq(PATCH_BODY));
    expect(mockMeiliUpdate).toHaveBeenCalledOnce();
  });

  it("includes _vectors.default in Meili update when embedding was regenerated", async () => {
    const newEmbedding = [0.9, 0.8];
    mockGetTrackEmbedding.mockResolvedValueOnce(newEmbedding);
    mockFindTrack.mockResolvedValueOnce(baseTrack({ bpm: 120 }));
    mockUpdateTrack.mockResolvedValueOnce(baseTrack({ bpm: 130 }));
    await PATCH(makeReq(PATCH_BODY));
    const meiliDoc = mockMeiliUpdate.mock.calls[0][0][0];
    expect(meiliDoc._vectors).toEqual({ default: newEmbedding });
  });

  it("does NOT include _vectors in Meili update when embedding was not regenerated", async () => {
    mockFindTrack.mockResolvedValueOnce(baseTrack({ star_rating: 3 }));
    mockUpdateTrack.mockResolvedValueOnce(baseTrack({ star_rating: 5 }));
    await PATCH(makeReq(PATCH_BODY));
    const meiliDoc = mockMeiliUpdate.mock.calls[0][0][0];
    expect(meiliDoc._vectors).toBeUndefined();
  });
});

// ─── Response ─────────────────────────────────────────────────────────────────

describe("PATCH /api/tracks/update — response", () => {
  it("returns 200 with the updated track", async () => {
    const updated = baseTrack({ star_rating: 5, title: "Updated Title" });
    mockFindTrack.mockResolvedValueOnce(baseTrack());
    mockUpdateTrack.mockResolvedValueOnce(updated);
    const res = await PATCH(makeReq(PATCH_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.star_rating).toBe(5);
    expect(body.title).toBe("Updated Title");
  });

  it("returns 500 when repository throws", async () => {
    mockFindTrack.mockResolvedValueOnce(baseTrack());
    mockUpdateTrack.mockRejectedValueOnce(new Error("DB error"));
    const res = await PATCH(makeReq(PATCH_BODY));
    expect(res.status).toBe(500);
  });
});
