import { vi, describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFindSimilarVibe = vi.hoisted(() => vi.fn());

vi.mock("@/server/services/embeddingsService", () => ({
  embeddingsService: {
    findSimilarVibe: mockFindSimilarVibe,
  },
}));

import { GET } from "../route";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/embeddings/similar-vibe");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

const VALID_PARAMS = { track_id: "track-abc", friend_id: "1" };

beforeEach(() => {
  mockFindSimilarVibe.mockReset();
  mockFindSimilarVibe.mockResolvedValue({ tracks: [] });
});

// ─── Required parameter validation ───────────────────────────────────────────

describe("GET /api/embeddings/similar-vibe — required parameters", () => {
  it("returns 400 when track_id is missing", async () => {
    const res = await GET(makeReq({ friend_id: "1" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/track_id|friend_id/i);
  });

  it("returns 400 when friend_id is missing", async () => {
    const res = await GET(makeReq({ track_id: "abc" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/track_id|friend_id/i);
  });

  it("returns 400 when friend_id is not a number", async () => {
    const res = await GET(makeReq({ track_id: "abc", friend_id: "not-a-number" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/friend_id/i);
  });

  it("returns 200 with valid parameters", async () => {
    const res = await GET(makeReq(VALID_PARAMS));
    expect(res.status).toBe(200);
  });
});

// ─── parsePositiveInt behavior (tested via limit/ivfflat_probes) ──────────────

describe("GET /api/embeddings/similar-vibe — parsePositiveInt", () => {
  it("uses provided positive integer for limit", async () => {
    await GET(makeReq({ ...VALID_PARAMS, limit: "30" }));
    expect(mockFindSimilarVibe).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 30 })
    );
  });

  it("uses default limit (50) when limit param is absent", async () => {
    await GET(makeReq(VALID_PARAMS));
    expect(mockFindSimilarVibe).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 })
    );
  });

  it("falls back to default limit (50) when limit is 0", async () => {
    await GET(makeReq({ ...VALID_PARAMS, limit: "0" }));
    expect(mockFindSimilarVibe).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 })
    );
  });

  it("falls back to default limit (50) when limit is negative", async () => {
    await GET(makeReq({ ...VALID_PARAMS, limit: "-5" }));
    expect(mockFindSimilarVibe).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 })
    );
  });

  it("falls back to default limit (50) when limit is non-numeric", async () => {
    await GET(makeReq({ ...VALID_PARAMS, limit: "abc" }));
    expect(mockFindSimilarVibe).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 })
    );
  });

  it("uses provided positive integer for ivfflat_probes", async () => {
    await GET(makeReq({ ...VALID_PARAMS, ivfflat_probes: "20" }));
    expect(mockFindSimilarVibe).toHaveBeenCalledWith(
      expect.objectContaining({ ivfflatProbes: 20 })
    );
  });

  it("uses default ivfflat_probes (10) when absent", async () => {
    await GET(makeReq(VALID_PARAMS));
    expect(mockFindSimilarVibe).toHaveBeenCalledWith(
      expect.objectContaining({ ivfflatProbes: 10 })
    );
  });

  it("falls back to default ivfflat_probes (10) when value is 0", async () => {
    await GET(makeReq({ ...VALID_PARAMS, ivfflat_probes: "0" }));
    expect(mockFindSimilarVibe).toHaveBeenCalledWith(
      expect.objectContaining({ ivfflatProbes: 10 })
    );
  });
});

// ─── Service call ─────────────────────────────────────────────────────────────

describe("GET /api/embeddings/similar-vibe — service integration", () => {
  it("passes track_id and friend_id to embeddingsService", async () => {
    await GET(makeReq({ track_id: "my-track", friend_id: "7" }));
    expect(mockFindSimilarVibe).toHaveBeenCalledWith(
      expect.objectContaining({ trackId: "my-track", friendId: 7 })
    );
  });

  it("returns the service result as JSON", async () => {
    mockFindSimilarVibe.mockResolvedValueOnce({ tracks: [{ track_id: "t2" }] });
    const res = await GET(makeReq(VALID_PARAMS));
    const body = await res.json();
    expect(body.tracks).toEqual([{ track_id: "t2" }]);
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe("GET /api/embeddings/similar-vibe — error handling", () => {
  it("returns 404 when service throws missing_audio_vibe_embedding", async () => {
    mockFindSimilarVibe.mockRejectedValueOnce(
      new Error("missing_audio_vibe_embedding")
    );
    const res = await GET(makeReq(VALID_PARAMS));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/embedding/i);
  });

  it("returns 500 for other errors", async () => {
    mockFindSimilarVibe.mockRejectedValueOnce(new Error("DB connection failed"));
    const res = await GET(makeReq(VALID_PARAMS));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("includes the error message in 500 response", async () => {
    mockFindSimilarVibe.mockRejectedValueOnce(new Error("timeout"));
    const res = await GET(makeReq(VALID_PARAMS));
    const body = await res.json();
    expect(body.message).toBe("timeout");
  });
});
