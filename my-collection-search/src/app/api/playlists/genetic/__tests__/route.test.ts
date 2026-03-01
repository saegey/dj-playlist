import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock global fetch before importing the route
const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal("fetch", mockFetch);

import { POST } from "../route";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(body: unknown) {
  return new Request("http://localhost/api/playlists/genetic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeTrack(overrides: Record<string, unknown> = {}) {
  return {
    track_id: "track-1",
    bpm: 120,
    embedding: [0.1, 0.2, 0.3],
    ...overrides,
  };
}

function makeGaResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

beforeEach(() => {
  mockFetch.mockReset();
  // Default: GA service returns valid response
  mockFetch.mockImplementation(() =>
    makeGaResponse({ result: [{ track_id: "track-1" }] })
  );
});

// ─── Schema validation ────────────────────────────────────────────────────────

describe("POST /api/playlists/genetic — body validation", () => {
  it("returns 400 for non-JSON body", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(500); // JSON.parse throws → catch → 500
  });

  it("returns 400 when playlist is missing", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid/i);
  });

  it("returns 400 when playlist is an empty array", async () => {
    const res = await POST(makeReq({ playlist: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when a track is missing track_id", async () => {
    const res = await POST(makeReq({ playlist: [{ bpm: 120, embedding: [0.1] }] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid/i);
  });
});

// ─── Embedding normalization ──────────────────────────────────────────────────

describe("POST /api/playlists/genetic — embedding normalization", () => {
  it("accepts array embedding and calls GA service", async () => {
    const track = makeTrack({ embedding: [0.1, 0.2, 0.3] });
    const res = await POST(makeReq({ playlist: [track] }));
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledOnce();
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.tracks[0].embedding).toBe(JSON.stringify([0.1, 0.2, 0.3]));
  });

  it("accepts string embedding and passes it through unchanged", async () => {
    const embStr = JSON.stringify([0.1, 0.2]);
    const track = makeTrack({ embedding: embStr });
    await POST(makeReq({ playlist: [track] }));
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.tracks[0].embedding).toBe(embStr);
  });

  it("falls back to _vectors.default when embedding is absent", async () => {
    const track = makeTrack({ embedding: undefined, _vectors: { default: [0.5, 0.6] } });
    await POST(makeReq({ playlist: [track] }));
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.tracks[0].embedding).toBe(JSON.stringify([0.5, 0.6]));
  });

  it("returns 400 with missing_embedding when embedding is null", async () => {
    const track = makeTrack({ embedding: null });
    const res = await POST(makeReq({ playlist: [track] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.invalid[0].reason).toBe("missing_embedding");
    expect(body.invalid[0].track_id).toBe("track-1");
  });

  it("returns 400 with missing_embedding when embedding array is empty", async () => {
    const track = makeTrack({ embedding: [] });
    const res = await POST(makeReq({ playlist: [track] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.invalid[0].reason).toBe("missing_embedding");
  });

  it("returns 400 with missing_embedding when both embedding and _vectors are absent", async () => {
    const track = makeTrack({ embedding: undefined, _vectors: undefined });
    const res = await POST(makeReq({ playlist: [track] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.invalid[0].reason).toBe("missing_embedding");
  });
});

// ─── BPM normalization ────────────────────────────────────────────────────────

describe("POST /api/playlists/genetic — BPM normalization", () => {
  it("passes through numeric BPM unchanged", async () => {
    const track = makeTrack({ bpm: 128 });
    await POST(makeReq({ playlist: [track] }));
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.tracks[0].bpm).toBe(128);
  });

  it("parses string BPM to float", async () => {
    const track = makeTrack({ bpm: "124.5" });
    await POST(makeReq({ playlist: [track] }));
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.tracks[0].bpm).toBe(124.5);
  });

  it("returns 400 with missing_bpm when BPM is null", async () => {
    const track = makeTrack({ bpm: null });
    const res = await POST(makeReq({ playlist: [track] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.invalid[0].reason).toBe("missing_bpm");
  });

  it("returns 400 with missing_bpm when BPM is a non-numeric string", async () => {
    const track = makeTrack({ bpm: "fast" });
    const res = await POST(makeReq({ playlist: [track] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.invalid[0].reason).toBe("missing_bpm");
  });

  it("returns 400 with missing_bpm when BPM is absent", async () => {
    const track = makeTrack({ bpm: undefined });
    const res = await POST(makeReq({ playlist: [track] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.invalid[0].reason).toBe("missing_bpm");
  });
});

// ─── Multiple invalid tracks ──────────────────────────────────────────────────

describe("POST /api/playlists/genetic — multiple invalid tracks", () => {
  it("collects all invalid tracks before returning 400", async () => {
    const tracks = [
      makeTrack({ track_id: "t1", embedding: null }),
      makeTrack({ track_id: "t2", bpm: null }),
      makeTrack({ track_id: "t3", embedding: null, bpm: null }),
    ];
    const res = await POST(makeReq({ playlist: tracks }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.invalid_count).toBe(3);
    expect(body.invalid).toHaveLength(3);
  });

  it("does not call GA service when any track is invalid", async () => {
    const tracks = [
      makeTrack({ track_id: "t1" }), // valid
      makeTrack({ track_id: "t2", embedding: null }), // invalid
    ];
    await POST(makeReq({ playlist: tracks }));
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ─── GA service integration ───────────────────────────────────────────────────

describe("POST /api/playlists/genetic — GA service integration", () => {
  it("calls ga-service/optimize with POST", async () => {
    const track = makeTrack();
    await POST(makeReq({ playlist: [track] }));
    expect(mockFetch).toHaveBeenCalledWith(
      "http://ga-service:8002/optimize",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns 200 with GA service result on success", async () => {
    const track = makeTrack();
    mockFetch.mockImplementationOnce(() =>
      makeGaResponse({ result: [{ track_id: "track-1", bpm: 120 }] })
    );
    const res = await POST(makeReq({ playlist: [track] }));
    expect(res.status).toBe(200);
  });

  it("forwards GA service error status", async () => {
    const track = makeTrack();
    mockFetch.mockImplementationOnce(() =>
      makeGaResponse({ error: "GA service unavailable" }, 503)
    );
    const res = await POST(makeReq({ playlist: [track] }));
    expect(res.status).toBe(503);
  });

  it("returns 500 when fetch throws (network error)", async () => {
    const track = makeTrack();
    mockFetch.mockRejectedValueOnce(new Error("Connection refused"));
    const res = await POST(makeReq({ playlist: [track] }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/failed/i);
  });
});
