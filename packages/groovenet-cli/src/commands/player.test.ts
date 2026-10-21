import { Command } from "commander";
import { spawn, type ChildProcess } from "node:child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlayerControlClient } from "@groovenet/player";
import { PlayerDaemon } from "@groovenet/player";
import { addPlayerCommands } from "./player.js";

vi.mock("node:child_process", () => ({ spawn: vi.fn(() => ({ unref: vi.fn(), once: vi.fn() })) }));

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  addPlayerCommands(program);
  return program;
}

describe("player CLI commands", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = 0;
  });

  it("prints status as JSON and closes the control connection", async () => {
    const close = vi.spyOn(PlayerControlClient.prototype, "close").mockResolvedValue();
    const request = vi.spyOn(PlayerControlClient.prototype, "request").mockResolvedValue({ status: "playing" });
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await makeProgram().parseAsync(["node", "test", "player", "status", "--json"]);
    expect(request).toHaveBeenCalledWith("status");
    expect(write).toHaveBeenCalledWith('{\n  "status": "playing"\n}\n');
    expect(close).toHaveBeenCalledOnce();
  });

  it("uses playlist queue options and renders queue entries", async () => {
    const request = vi.spyOn(PlayerControlClient.prototype, "request").mockResolvedValue([
      { id: "entry-1", track: { title: "Blue Train", artist: "John Coltrane" } },
    ]);
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await makeProgram().parseAsync(["node", "test", "player", "queue", "add", "--playlist", "18"]);
    expect(request).toHaveBeenCalledWith("queue.add", { playlistId: "18" });
    expect(log).toHaveBeenCalledWith("1. Blue Train — John Coltrane [entry-1]");
  });

  it("toggles pause to resume when playback is already paused", async () => {
    const request = vi.spyOn(PlayerControlClient.prototype, "request")
      .mockResolvedValueOnce({ status: "paused" })
      .mockResolvedValueOnce({ status: "playing" });
    await makeProgram().parseAsync(["node", "test", "player", "pause", "--json"]);
    expect(request.mock.calls).toEqual([["status"], ["resume"]]);
  });

  it("returns a non-zero exit code when the daemon is unavailable", async () => {
    const request = vi.spyOn(PlayerControlClient.prototype, "request").mockRejectedValue(new Error("daemon down"));
    const error = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    await makeProgram().parseAsync(["node", "test", "player", "next"]);
    expect(request).toHaveBeenCalledWith("next");
    expect(error).toHaveBeenCalledWith(expect.stringContaining("daemon down"));
    expect(process.exitCode).toBe(1);
  });

  it("routes the remaining control commands and renders human output", async () => {
    const request = vi.spyOn(PlayerControlClient.prototype, "request")
      .mockResolvedValue({ status: "playing", current: { track: { title: "Blue Train", artist: "John Coltrane" } }, position: 12.4, duration: 180, volume: 70 })
      .mockResolvedValueOnce({ status: "playing", current: { track: { title: "Blue Train", artist: "John Coltrane" } }, position: 12.4, duration: 180, volume: 70 })
      .mockResolvedValueOnce({ status: "playing" })
      .mockResolvedValueOnce({ status: "playing" })
      .mockResolvedValueOnce({ status: "playing" })
      .mockResolvedValueOnce({ status: "playing" })
      .mockResolvedValueOnce({ status: "playing" })
      .mockResolvedValueOnce({ status: "playing" })
      .mockResolvedValueOnce([{ id: "entry-1", track: { title: "Blue Train", artist: "John Coltrane" } }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "airplay", name: "Living room", description: "AirPlay" }])
      .mockResolvedValueOnce({ stopping: true })
      .mockResolvedValueOnce({ stopping: true });
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const success = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    for (const args of [
      ["play"], ["play", "2"], ["seek", "12.5"], ["volume", "72"], ["prev"],
      ["queue", "remove", "entry-1"], ["queue", "remove", "12"], ["queue", "list"], ["queue", "list"], ["devices"], ["stop"], ["stop", "--json"],
    ]) await makeProgram().parseAsync(["node", "test", "player", ...args]);

    expect(request.mock.calls.map(([method, params]) => [method, params])).toEqual([
      ["play", undefined], ["play", { index: 2 }], ["seek", { seconds: 12.5 }], ["volume", { volume: 72 }], ["prev", undefined],
      ["queue.remove", { id: "entry-1" }], ["queue.remove", { index: 12 }], ["queue.list", undefined], ["queue.list", undefined], ["devices", undefined], ["shutdown", undefined], ["shutdown", undefined],
    ]);
    expect(log).toHaveBeenCalledWith("Status: playing — Blue Train / John Coltrane");
    expect(log).toHaveBeenCalledWith("Position: 12s / 180s");
    expect(log).toHaveBeenCalledWith("Volume: 70%");
    expect(log).toHaveBeenCalledWith("No entries.");
    expect(log).toHaveBeenCalledWith("1. Living room — AirPlay [airplay]");
    expect(success).toHaveBeenCalledWith(expect.stringContaining("Player daemon stopped."));
  });

  it("starts a detached daemon and prints the JSON result", async () => {
    const request = vi.spyOn(PlayerControlClient.prototype, "request").mockResolvedValue({ status: "stopped" });
    vi.spyOn(PlayerControlClient.prototype, "close").mockResolvedValue();
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await makeProgram().parseAsync(["node", "test", "player", "start", "--detach", "--json"]);
    expect(request).toHaveBeenCalledWith("status");
    expect(write).toHaveBeenCalledWith(expect.stringContaining('"started": true'));
  });

  it("retries briefly when the detached daemon has not opened its socket yet", async () => {
    vi.spyOn(PlayerControlClient.prototype, "request")
      .mockRejectedValueOnce(new Error("starting"))
      .mockResolvedValue({ status: "stopped" });
    vi.spyOn(PlayerControlClient.prototype, "close").mockResolvedValue();
    const success = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await makeProgram().parseAsync(["node", "test", "player", "start", "--detach"]);
    expect(success).toHaveBeenCalledWith(expect.stringContaining("Player daemon started."));
  });

  it("fails quickly when spawning the detached daemon fails", async () => {
    const child = { unref: vi.fn(), once: (_event: string, listener: (error: Error) => void) => { listener(new Error("spawn failed")); return child; } } as unknown as ChildProcess;
    vi.mocked(spawn).mockReturnValueOnce(child);
    const error = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    await makeProgram().parseAsync(["node", "test", "player", "start", "--detach"]);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("Could not start the player daemon: spawn failed"));
  });

  it("fails when a detached daemon never becomes available", async () => {
    vi.spyOn(PlayerControlClient.prototype, "request").mockRejectedValue(new Error("not ready"));
    vi.spyOn(PlayerControlClient.prototype, "close").mockResolvedValue();
    vi.spyOn(Date, "now").mockReturnValueOnce(0).mockReturnValueOnce(6000);
    const error = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    await makeProgram().parseAsync(["node", "test", "player", "start", "--detach"]);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("Player daemon did not start: undefined"));
  });

  it("reports daemon startup failures from foreground and internal starts", async () => {
    const start = vi.spyOn(PlayerDaemon.prototype, "start").mockRejectedValue(new Error("already running"));
    const error = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    await makeProgram().parseAsync(["node", "test", "player", "start"]);
    expect(start).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith(expect.stringContaining("already running"));
    process.exitCode = 0;
    await makeProgram().parseAsync(["node", "test", "player", "_daemon"]);
    expect(start).toHaveBeenCalledTimes(2);
  });

  it("stops a foreground daemon when it receives SIGINT", async () => {
    const start = vi.spyOn(PlayerDaemon.prototype, "start").mockResolvedValue();
    const stop = vi.spyOn(PlayerDaemon.prototype, "stop").mockResolvedValue();
    const success = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    setImmediate(() => process.emit("SIGINT"));
    await makeProgram().parseAsync(["node", "test", "player", "start"]);
    expect(start).toHaveBeenCalledOnce();
    expect(stop).toHaveBeenCalledOnce();
    expect(success).toHaveBeenCalledWith(expect.stringContaining("Player daemon running."));
  });

  it("keeps the internal daemon alive until a termination signal", async () => {
    const start = vi.spyOn(PlayerDaemon.prototype, "start").mockResolvedValue();
    const stop = vi.spyOn(PlayerDaemon.prototype, "stop").mockResolvedValue();
    await makeProgram().parseAsync(["node", "test", "player", "_daemon"]);
    expect(start).toHaveBeenCalledOnce();
    process.emit("SIGTERM");
    expect(stop).toHaveBeenCalledOnce();
  });
});
