import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  mockMkdir,
  mockWriteFile,
  mockStat,
  mockUnlink,
  mockExec,
  mockWriteEssentiaAnalysis,
  mockUpdateTrackAnalysis,
  mockFindTracksByTrackId,
  mockEnqueue,
} = vi.hoisted(() => ({
  mockMkdir: vi.fn(),
  mockWriteFile: vi.fn(),
  mockStat: vi.fn(),
  mockUnlink: vi.fn(),
  mockExec: vi.fn(),
  mockWriteEssentiaAnalysis: vi.fn(),
  mockUpdateTrackAnalysis: vi.fn(),
  mockFindTracksByTrackId: vi.fn(),
  mockEnqueue: vi.fn(),
}));

vi.mock("fs", () => ({
  promises: {
    mkdir: mockMkdir,
    writeFile: mockWriteFile,
    stat: mockStat,
    unlink: mockUnlink,
  },
}));

// promisify(exec) drives this via the (command, callback) contract.
vi.mock("child_process", () => ({ exec: mockExec }));

vi.mock("@/lib/essentia-storage", () => ({
  writeEssentiaAnalysis: mockWriteEssentiaAnalysis,
}));

vi.mock("@/server/repositories/trackRepository", () => ({
  trackRepository: {
    updateTrackAnalysisByTrackId: mockUpdateTrackAnalysis,
    findTracksByTrackId: mockFindTracksByTrackId,
  },
}));

vi.mock("@/server/services/embeddingQueueService", () => ({
  embeddingQueueService: { enqueue: mockEnqueue },
}));

import { POST } from "../route";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest({
  friendId = "1",
  includeFile = true,
  trackId = "t1",
}: { friendId?: string | null; includeFile?: boolean; trackId?: string } = {}) {
  const formData = new FormData();
  if (includeFile) {
    formData.append(
      "file",
      new File([new Uint8Array([1, 2, 3])], "song.mp3", { type: "audio/mpeg" })
    );
  }
  formData.append("track_id", trackId);
  if (friendId !== null) formData.append("friend_id", friendId);
  return new NextRequest("http://localhost/api/tracks/upload", {
    method: "POST",
    body: formData,
  });
}

function essentiaResponse(tonal: unknown) {
  return {
    ok: true,
    json: async () => ({
      rhythm: { bpm: 123.6, danceability: 0.8 },
      tonal,
      metadata: { audio_properties: { length: 245.2 } },
    }),
  };
}

describe("POST /api/tracks/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockStat.mockResolvedValue({ isFile: () => true });
    mockUnlink.mockResolvedValue(undefined);
    mockExec.mockImplementation(
      (_cmd: string, cb: (e: unknown, stdout?: string, stderr?: string) => void) =>
        cb(null, "", "")
    );
    mockUpdateTrackAnalysis.mockResolvedValue(undefined);
    mockFindTracksByTrackId.mockResolvedValue([{ track_id: "t1", friend_id: 1 }]);
    mockEnqueue.mockResolvedValue(undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        essentiaResponse({
          key_edma: { key: "F", scale: "major", strength: 0.62 },
          key_krumhansl: { key: "C", scale: "major", strength: 0.58 },
          key_temperley: { key: "C", scale: "major", strength: 0.55 },
        })
      )
    );
  });

  it("stores the edma key and its confidence, not just the key", async () => {
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockUpdateTrackAnalysis).toHaveBeenCalledWith(
      "t1",
      expect.objectContaining({ key: "F major", key_confidence: 0.62 })
    );
  });

  it("logs when krumhansl/temperley disagree with the stored edma key (#524)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await POST(makeRequest());

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("stored edma=F major")
    );
    warnSpy.mockRestore();
  });

  it("does not log a disagreement when all three profiles agree", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        essentiaResponse({
          key_edma: { key: "D", scale: "minor", strength: 0.9 },
          key_krumhansl: { key: "D", scale: "minor", strength: 0.9 },
          key_temperley: { key: "D", scale: "minor", strength: 0.9 },
        })
      )
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await POST(makeRequest());

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Key profile disagreement")
    );
    warnSpy.mockRestore();
  });

  it("skips disagreement logging when friend_id is missing", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await POST(makeRequest({ friendId: null }));

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Key profile disagreement")
    );
    warnSpy.mockRestore();
  });

  it("warns but still succeeds when persisting the analysis JSON fails", async () => {
    mockWriteEssentiaAnalysis.mockImplementation(() => {
      throw new Error("disk full");
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(warnSpy).toHaveBeenCalledWith(
      "Failed to persist Essentia analysis file:",
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });

  it("returns 400 when the file is missing", async () => {
    const res = await POST(makeRequest({ includeFile: false }));

    expect(res.status).toBe(400);
    expect(mockUpdateTrackAnalysis).not.toHaveBeenCalled();
  });
});
