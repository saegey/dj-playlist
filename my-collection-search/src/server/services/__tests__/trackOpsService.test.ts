import { describe, it, expect, vi, beforeEach } from "vitest";
import { TrackOpsService } from "../trackOpsService";

// ─── mocks ────────────────────────────────────────────────────────────────────

const trackRepo = vi.hoisted(() => ({
  findTrackWithLocalAudio: vi.fn(),
  findTracksMissingDurationWithLocalM4a: vi.fn(),
  findTracksForEssentiaBackfill: vi.fn(),
  findCoverArtBackfillCandidates: vi.fn(),
}));

const jobService = vi.hoisted(() => ({
  createDurationJob: vi.fn(),
  createAnalyzeLocalJob: vi.fn(),
  createCoverArtAlbumJob: vi.fn(),
}));

const mockFsExistsSync = vi.hoisted(() => vi.fn());

vi.mock("@/server/repositories/trackRepository", () => ({
  trackRepository: trackRepo,
}));

vi.mock("@/server/services/redisJobService", () => ({
  redisJobService: jobService,
}));

vi.mock("fs", () => ({
  default: { existsSync: mockFsExistsSync },
  existsSync: mockFsExistsSync,
}));

// getEssentiaAnalysisPath returns a deterministic path we can control via fs mock
vi.mock("@/lib/essentia-storage", () => ({
  getEssentiaAnalysisPath: (trackId: string, friendId: number) =>
    `/audio/${friendId}/${trackId}.json`,
}));

// ─── setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

function makeService() {
  return new TrackOpsService();
}

// ─── queueDurationFixForTrack ─────────────────────────────────────────────────

describe("queueDurationFixForTrack()", () => {
  it("returns 404 when the track is not found", async () => {
    trackRepo.findTrackWithLocalAudio.mockResolvedValue(null);

    const result = await makeService().queueDurationFixForTrack({
      track_id: "t1",
      friend_id: 1,
    });

    expect(result).toEqual({ success: false, code: 404, error: "Track not found" });
    expect(jobService.createDurationJob).not.toHaveBeenCalled();
  });

  it("returns 400 when the track has no local_audio_url", async () => {
    trackRepo.findTrackWithLocalAudio.mockResolvedValue({
      track_id: "t1",
      friend_id: 1,
      local_audio_url: null,
    });

    const result = await makeService().queueDurationFixForTrack({
      track_id: "t1",
      friend_id: 1,
    });

    expect(result).toEqual({
      success: false,
      code: 400,
      error: "Track has no local_audio_url",
    });
    expect(jobService.createDurationJob).not.toHaveBeenCalled();
  });

  it("creates a duration job and returns success", async () => {
    trackRepo.findTrackWithLocalAudio.mockResolvedValue({
      track_id: "t1",
      friend_id: 1,
      local_audio_url: "/audio/t1.m4a",
    });
    jobService.createDurationJob.mockResolvedValue("job-abc");

    const result = await makeService().queueDurationFixForTrack({
      track_id: "t1",
      friend_id: 1,
    });

    expect(jobService.createDurationJob).toHaveBeenCalledWith({
      track_id: "t1",
      friend_id: 1,
      local_audio_url: "/audio/t1.m4a",
    });
    expect(result).toEqual({
      success: true,
      jobId: "job-abc",
      track_id: "t1",
      friend_id: 1,
    });
  });
});

// ─── queueMissingDurationFixJobs ──────────────────────────────────────────────

describe("queueMissingDurationFixJobs()", () => {
  it("returns zero counts when no tracks need fixing", async () => {
    trackRepo.findTracksMissingDurationWithLocalM4a.mockResolvedValue([]);

    const result = await makeService().queueMissingDurationFixJobs();
    expect(result).toEqual({ queued: 0, jobIds: [], errors: [] });
  });

  it("queues a job for each track and returns all job IDs", async () => {
    trackRepo.findTracksMissingDurationWithLocalM4a.mockResolvedValue([
      { track_id: "t1", friend_id: 1, local_audio_url: "/audio/t1.m4a" },
      { track_id: "t2", friend_id: 1, local_audio_url: "/audio/t2.m4a" },
    ]);
    jobService.createDurationJob
      .mockResolvedValueOnce("job-1")
      .mockResolvedValueOnce("job-2");

    const result = await makeService().queueMissingDurationFixJobs();

    expect(result.queued).toBe(2);
    expect(result.jobIds).toEqual(["job-1", "job-2"]);
    expect(result.errors).toEqual([]);
  });

  it("collects errors for failed jobs and continues processing", async () => {
    trackRepo.findTracksMissingDurationWithLocalM4a.mockResolvedValue([
      { track_id: "t1", friend_id: 1, local_audio_url: "/audio/t1.m4a" },
      { track_id: "t2", friend_id: 1, local_audio_url: "/audio/t2.m4a" },
    ]);
    jobService.createDurationJob
      .mockRejectedValueOnce(new Error("Redis down"))
      .mockResolvedValueOnce("job-2");

    const result = await makeService().queueMissingDurationFixJobs();

    expect(result.queued).toBe(1);
    expect(result.jobIds).toEqual(["job-2"]);
    expect(result.errors).toEqual([{ track_id: "t1", error: "Redis down" }]);
  });
});

// ─── queueEssentiaBackfillJobs ────────────────────────────────────────────────

describe("queueEssentiaBackfillJobs()", () => {
  it("returns zero counts when no tracks are candidates", async () => {
    trackRepo.findTracksForEssentiaBackfill.mockResolvedValue([]);

    const result = await makeService().queueEssentiaBackfillJobs({
      friend_id: null,
      force: false,
    });

    expect(result).toEqual({
      queued: 0,
      skipped_existing: 0,
      total_candidates: 0,
      force: false,
      jobIds: [],
      errors: [],
    });
  });

  it("skips tracks whose analysis file already exists when force is false", async () => {
    trackRepo.findTracksForEssentiaBackfill.mockResolvedValue([
      { track_id: "t1", friend_id: 1, local_audio_url: "/audio/t1.m4a" },
    ]);
    mockFsExistsSync.mockReturnValue(true); // analysis file exists

    const result = await makeService().queueEssentiaBackfillJobs({
      friend_id: null,
      force: false,
    });

    expect(result.skipped_existing).toBe(1);
    expect(result.queued).toBe(0);
    expect(jobService.createAnalyzeLocalJob).not.toHaveBeenCalled();
  });

  it("queues tracks even when analysis file exists when force is true", async () => {
    trackRepo.findTracksForEssentiaBackfill.mockResolvedValue([
      { track_id: "t1", friend_id: 1, local_audio_url: "/audio/t1.m4a" },
    ]);
    mockFsExistsSync.mockReturnValue(true);
    jobService.createAnalyzeLocalJob.mockResolvedValue("job-1");

    const result = await makeService().queueEssentiaBackfillJobs({
      friend_id: null,
      force: true,
    });

    expect(result.queued).toBe(1);
    expect(result.skipped_existing).toBe(0);
    expect(jobService.createAnalyzeLocalJob).toHaveBeenCalled();
  });

  it("skips tracks with no local_audio_url", async () => {
    trackRepo.findTracksForEssentiaBackfill.mockResolvedValue([
      { track_id: "t1", friend_id: 1, local_audio_url: null },
    ]);

    const result = await makeService().queueEssentiaBackfillJobs({
      friend_id: null,
      force: true,
    });

    expect(result.queued).toBe(0);
    expect(jobService.createAnalyzeLocalJob).not.toHaveBeenCalled();
  });

  it("queues tracks whose analysis file does not exist", async () => {
    trackRepo.findTracksForEssentiaBackfill.mockResolvedValue([
      { track_id: "t1", friend_id: 1, local_audio_url: "/audio/t1.m4a" },
    ]);
    mockFsExistsSync.mockReturnValue(false);
    jobService.createAnalyzeLocalJob.mockResolvedValue("job-1");

    const result = await makeService().queueEssentiaBackfillJobs({
      friend_id: null,
      force: false,
    });

    expect(result.queued).toBe(1);
    expect(result.skipped_existing).toBe(0);
  });

  it("passes friend_id filter to the repository", async () => {
    trackRepo.findTracksForEssentiaBackfill.mockResolvedValue([]);

    await makeService().queueEssentiaBackfillJobs({ friend_id: 3, force: false });

    expect(trackRepo.findTracksForEssentiaBackfill).toHaveBeenCalledWith(3, undefined);
  });

  it("collects errors for failed jobs and continues processing", async () => {
    trackRepo.findTracksForEssentiaBackfill.mockResolvedValue([
      { track_id: "t1", friend_id: 1, local_audio_url: "/audio/t1.m4a" },
      { track_id: "t2", friend_id: 1, local_audio_url: "/audio/t2.m4a" },
    ]);
    mockFsExistsSync.mockReturnValue(false);
    jobService.createAnalyzeLocalJob
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce("job-2");

    const result = await makeService().queueEssentiaBackfillJobs({
      friend_id: null,
      force: false,
    });

    expect(result.queued).toBe(1);
    expect(result.errors).toEqual([
      { track_id: "t1", friend_id: 1, error: "timeout" },
    ]);
  });
});

// ─── queueCoverArtBackfillJobs ────────────────────────────────────────────────

describe("queueCoverArtBackfillJobs()", () => {
  it("returns zero counts when there are no candidates", async () => {
    trackRepo.findCoverArtBackfillCandidates.mockResolvedValue([]);

    const result = await makeService().queueCoverArtBackfillJobs({ friend_id: null });

    expect(result).toEqual({
      queued: 0,
      queuedAlbums: 0,
      tracksImpacted: 0,
      jobIds: [],
      errors: [],
    });
  });

  it("queues a cover art job for each candidate and sums tracksImpacted", async () => {
    trackRepo.findCoverArtBackfillCandidates.mockResolvedValue([
      { track_id: "t1", friend_id: 1, release_id: "r1", missing_tracks: 3 },
      { track_id: "t2", friend_id: 1, release_id: "r2", missing_tracks: 5 },
    ]);
    jobService.createCoverArtAlbumJob
      .mockResolvedValueOnce("job-1")
      .mockResolvedValueOnce("job-2");

    const result = await makeService().queueCoverArtBackfillJobs({ friend_id: null });

    expect(result.queued).toBe(2);
    expect(result.queuedAlbums).toBe(2);
    expect(result.tracksImpacted).toBe(8);
    expect(result.jobIds).toEqual(["job-1", "job-2"]);
    expect(result.errors).toEqual([]);
  });

  it("records an error when release_id is missing and continues", async () => {
    trackRepo.findCoverArtBackfillCandidates.mockResolvedValue([
      { track_id: "t1", friend_id: 1, release_id: null, missing_tracks: 2 },
      { track_id: "t2", friend_id: 1, release_id: "r2", missing_tracks: 1 },
    ]);
    jobService.createCoverArtAlbumJob.mockResolvedValue("job-2");

    const result = await makeService().queueCoverArtBackfillJobs({ friend_id: null });

    expect(result.queued).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      track_id: "t1",
      release_id: null,
      error: "Missing release_id",
    });
  });

  it("passes friend_id filter to the repository", async () => {
    trackRepo.findCoverArtBackfillCandidates.mockResolvedValue([]);

    await makeService().queueCoverArtBackfillJobs({ friend_id: 7 });

    expect(trackRepo.findCoverArtBackfillCandidates).toHaveBeenCalledWith(7);
  });
});
