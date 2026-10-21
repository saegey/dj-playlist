import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadConfig: vi.fn(),
  client: { logPlaylistSpins: vi.fn(), getLiveSet: vi.fn(), checkPlaylist: vi.fn() },
  Client: vi.fn(),
  printJson: vi.fn(),
  printSuccess: vi.fn(),
  printError: vi.fn(),
}));

vi.mock("@groovenet/client", async (importOriginal) => ({
  formatDurationHms: (await importOriginal<typeof import("@groovenet/client")>()).formatDurationHms,
  loadConfig: mocks.loadConfig,
  GroovenetClient: mocks.Client,
}));
vi.mock("../output.js", () => ({
  printPlaylists: vi.fn(),
  printTracks: vi.fn(),
  printJson: mocks.printJson,
  printSuccess: mocks.printSuccess,
  printError: mocks.printError,
}));

import { Command } from "commander";
import { addPlaylistsCommands, formatPlaylistCheck } from "./playlists.js";

beforeEach(() => {
  vi.clearAllMocks();
  process.exitCode = undefined;
  mocks.loadConfig.mockReturnValue({ api_base: "http://example.test/api" });
  mocks.Client.mockImplementation(function () { return mocks.client; });
  mocks.client.logPlaylistSpins.mockResolvedValue({
    playlist_id: 9,
    performance_id: 4,
    performed_at: "2026-10-01T20:00:00.000Z",
    created: 2,
    skipped: 0,
  });
  mocks.client.getLiveSet.mockResolvedValue({ title: "Sunday set", status: "active" });
});

afterEach(() => { process.exitCode = undefined; });

describe("playlists log-spins", () => {
  it("forwards performance and derivation options and supports JSON", async () => {
    const program = new Command().exitOverride();
    addPlaylistsCommands(program);
    await program.parseAsync([
      "node", "test", "playlists", "log-spins", "9",
      "--performance", "4", "--derivation", "11111111-1111-4111-8111-111111111111", "--json",
    ]);
    expect(mocks.client.logPlaylistSpins).toHaveBeenCalledWith("9", {
      performance_id: 4,
      derivation_id: "11111111-1111-4111-8111-111111111111",
    });
    expect(mocks.printJson).toHaveBeenCalledWith(expect.objectContaining({ created: 2 }));
  });

  it("normalizes a supplied timestamp", async () => {
    const program = new Command().exitOverride();
    addPlaylistsCommands(program);
    await program.parseAsync(["node", "test", "playlists", "log-spins", "9", "--at", "2026-10-01T20:00:00Z"]);
    expect(mocks.client.logPlaylistSpins).toHaveBeenCalledWith("9", {
      performed_at: "2026-10-01T20:00:00.000Z",
    });
    expect(mocks.printSuccess).toHaveBeenCalledWith("Logged 2 spins.");
  });

  it("prints an idempotent rerun and a partial skip", async () => {
    const program = new Command().exitOverride();
    addPlaylistsCommands(program);
    mocks.client.logPlaylistSpins.mockResolvedValueOnce({
      playlist_id: 9, performance_id: 4, performed_at: "2026-10-01T20:00:00Z", created: 0, skipped: 2,
    });
    await program.parseAsync(["node", "test", "playlists", "log-spins", "9"]);
    expect(mocks.printSuccess).toHaveBeenCalledWith("Already logged (2 spins skipped).");

    mocks.client.logPlaylistSpins.mockResolvedValueOnce({
      playlist_id: 9, performance_id: 4, performed_at: "2026-10-01T20:00:00Z", created: 1, skipped: 1,
    });
    await program.parseAsync(["node", "test", "playlists", "log-spins", "9"]);
    expect(mocks.printSuccess).toHaveBeenCalledWith("Logged 1 spins; 1 already existed.");
  });

  it("rejects invalid timestamps before calling the API", async () => {
    const program = new Command().exitOverride();
    addPlaylistsCommands(program);
    await program.parseAsync(["node", "test", "playlists", "log-spins", "9", "--at", "not-a-date"]);
    expect(mocks.client.logPlaylistSpins).not.toHaveBeenCalled();
    expect(mocks.printError).toHaveBeenCalledWith("Invalid timestamp: not-a-date");
  });

  it("prints non-Error API failures", async () => {
    const program = new Command().exitOverride();
    addPlaylistsCommands(program);
    mocks.client.logPlaylistSpins.mockRejectedValueOnce("offline");
    await program.parseAsync(["node", "test", "playlists", "log-spins", "9"]);
    expect(mocks.printError).toHaveBeenCalledWith("offline");
    expect(process.exitCode).toBe(1);
  });

  it("rejects timestamp and performance together before calling the API", async () => {
    const program = new Command().exitOverride();
    addPlaylistsCommands(program);
    await program.parseAsync([
      "node", "test", "playlists", "log-spins", "9", "--at", "2026-10-01", "--performance", "4",
    ]);
    expect(mocks.client.logPlaylistSpins).not.toHaveBeenCalled();
    expect(mocks.printError).toHaveBeenCalledWith("Provide either --at or --performance, not both.");
    expect(process.exitCode).toBe(1);
  });
});

describe("playlists set show", () => {
  it("prints the set as JSON when requested", async () => {
    const program = new Command().exitOverride();
    addPlaylistsCommands(program);
    await program.parseAsync(["node", "test", "playlists", "set", "show", "12", "--json"]);

    expect(mocks.client.getLiveSet).toHaveBeenCalledWith("12");
    expect(mocks.printJson).toHaveBeenCalledWith({ title: "Sunday set", status: "active" });
  });

  it("prints a readable set summary by default", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const program = new Command().exitOverride();
      addPlaylistsCommands(program);
      await program.parseAsync(["node", "test", "playlists", "set", "show", "12"]);

      expect(mocks.client.getLiveSet).toHaveBeenCalledWith("12");
      expect(log).toHaveBeenCalledWith("Sunday set · active");
    } finally {
      log.mockRestore();
    }
  });

  it("uses a fallback for sets without a title", async () => {
    mocks.client.getLiveSet.mockResolvedValueOnce({ title: "", status: "active" });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const program = new Command().exitOverride();
      addPlaylistsCommands(program);
      await program.parseAsync(["node", "test", "playlists", "set", "show", "12"]);

      expect(log).toHaveBeenCalledWith("Untitled set · active");
    } finally {
      log.mockRestore();
    }
  });
});

const cleanCheck = {
  track_count: 0, total_duration_seconds: 0, missing_duration: [],
  bpm: { threshold: 8, curve: [], jumps: [], missing: [] },
  keys: { clashes: [], missing: [] },
  repeated_releases: [], side_order_violations: [], ok: true, unresolved_track_ids: [],
};

const problemCheck = {
  track_count: 3, total_duration_seconds: 3725, missing_duration: [3],
  bpm: {
    threshold: 8,
    curve: [
      { position: 1, track_id: "1-A1", bpm: 120 },
      { position: 2, track_id: "1-A2", bpm: 100 },
      { position: 3, track_id: "2-B1", bpm: null },
    ],
    jumps: [{ from_position: 1, to_position: 2, from_track_id: "1-A1", to_track_id: "1-A2", from_bpm: 120, to_bpm: 100, delta: -20 }],
    missing: [3],
  },
  keys: {
    clashes: [{ from_position: 1, to_position: 2, from_track_id: "1-A1", to_track_id: "1-A2", from_key: "A minor", to_key: "F# minor", from_camelot: "8A", to_camelot: "11A" }],
    missing: [3],
  },
  repeated_releases: [{ release: "1", positions: [1, 2], track_ids: ["1-A1", "1-A2"] }],
  side_order_violations: [{ release: "1", position: 2, track_id: "1-A2", after_track_id: "1-B1", reason: "side A comes after side B was already played" }],
  ok: false, unresolved_track_ids: ["ghost"],
};

describe("formatPlaylistCheck", () => {
  const plain = (c: typeof cleanCheck) => formatPlaylistCheck(c).join("\n").replace(/\u001b\[[0-9;]*m/g, "");

  it("shows a tick for every clean section and no curve table for an empty playlist", () => {
    const out = plain(cleanCheck);
    expect(out).toContain("0 tracks · 0:00");
    for (const h of ["BPM jumps above 8", "Key clashes", "Repeated releases", "Side-order violations"]) expect(out).toContain(`✓ ${h}`);
    expect(out).not.toContain("no BPM");
  });

  it("lists each problem, the curve with its jump, and the missing data", () => {
    const out = plain(problemCheck as unknown as typeof cleanCheck);
    expect(out).toContain("3 tracks · 1:02:05");
    expect(out).toContain("no duration (not counted): #3");
    expect(out).toContain("Not found, skipped: ghost");
    expect(out).toContain("⚠ BPM jumps above 8 (1)");
    expect(out).toContain("-20");
    expect(out).toContain("no BPM: #3");
    expect(out).toContain("#1 → #2  A minor (8A) → F# minor (11A)");
    expect(out).toContain("no usable key: #3");
    expect(out).toContain("release 1 at #1, #2  (1-A1, 1-A2)");
    expect(out).toContain("#2 1-A2: side A comes after side B was already played");
  });

  it("prefixes an upward jump with a plus", () => {
    const up = { ...problemCheck, bpm: { ...problemCheck.bpm, jumps: [{ ...problemCheck.bpm.jumps[0]!, delta: 12 }] } };
    expect(plain(up as unknown as typeof cleanCheck)).toContain("+12");
  });
});

describe("playlists check", () => {
  const run = (...args: string[]) => {
    const program = new Command().exitOverride();
    addPlaylistsCommands(program);
    return program.parseAsync(["node", "test", "playlists", "check", ...args]);
  };

  it("prints JSON and forwards the default threshold", async () => {
    mocks.client.checkPlaylist.mockResolvedValue(problemCheck);
    await run("178", "--json");
    expect(mocks.client.checkPlaylist).toHaveBeenCalledWith("178", { bpmJumpThreshold: 8 });
    expect(mocks.printJson).toHaveBeenCalledWith(problemCheck);
  });

  it("forwards a custom threshold and prints the readable report", async () => {
    mocks.client.checkPlaylist.mockResolvedValue(cleanCheck);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await run("178", "--bpm-threshold", "5");
    expect(mocks.client.checkPlaylist).toHaveBeenCalledWith("178", { bpmJumpThreshold: 5 });
    expect(log).toHaveBeenCalled();
    expect(mocks.printJson).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("reports errors and exits 1", async () => {
    mocks.client.checkPlaylist.mockRejectedValue(new Error("API Error: not found"));
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    await run("1");
    expect(mocks.printError).toHaveBeenCalledWith("API Error: not found");
    expect(exit).toHaveBeenCalledWith(1);

    mocks.client.checkPlaylist.mockRejectedValue("boom");
    await run("1");
    expect(mocks.printError).toHaveBeenCalledWith("boom");
    exit.mockRestore();
  });
});
