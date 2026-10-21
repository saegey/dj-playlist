import { EventEmitter } from "node:events";
import { mkdtemp, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Socket } from "node:net";
import type { Track } from "@groovenet/client";
import { describe, expect, it, vi } from "vitest";
import { PlayerDaemon } from "./daemon.js";
import { PlayerCore } from "./player.js";
import { TrackResolver } from "./resolver.js";
import { TestPlaybackBackend } from "./testing.js";
import type { GroovenetClient } from "@groovenet/client";

class FakeServer extends EventEmitter {
  listening = false;
  accept: ((socket: Socket) => void) | undefined;
  failListen = false;
  listen(): this { setImmediate(() => this.failListen ? this.emit("error", new Error("listen failed")) : (this.listening = true, this.emit("listening"))); return this; }
  close(callback?: (error?: Error) => void): this { this.listening = false; callback?.(); return this; }
}

class FakeSocket extends EventEmitter {
  writable = true;
  responses: string[] = [];
  write(data: string): boolean { this.responses.push(data); return true; }
  destroy(): this { this.writable = false; this.emit("close"); return this; }
}

function makePlayer(searchTracks?: (query: string) => Promise<{ tracks: Track[] }>, backend = new TestPlaybackBackend()) {
  const client = { searchTracks: searchTracks ?? (async () => ({ tracks: [] })) } as GroovenetClient;
  return new PlayerCore(backend, new TrackResolver(client, { apiBase: "http://localhost/api" }));
}

function makeDaemon(player = makePlayer()) {
  const dirPromise = mkdtemp(join(tmpdir(), "groovenet-daemon-"));
  return dirPromise.then((dir) => {
    const paths = { socketPath: join(dir, "player.sock"), pidPath: join(dir, "player.pid") };
    const server = new FakeServer();
    const daemon = new PlayerDaemon({
      player, paths,
      createServer: ((accept: (socket: Socket) => void) => { server.accept = accept; return server; }) as unknown as typeof import("node:net").createServer,
    });
    return { dir, paths, server, daemon, player };
  });
}

async function send(socket: FakeSocket, request: unknown): Promise<Record<string, unknown>> {
  socket.emit("data", Buffer.from(`${typeof request === "string" ? request : JSON.stringify(request)}\n`));
  await new Promise((resolve) => setImmediate(resolve));
  return JSON.parse(socket.responses.at(-1)! as string) as Record<string, unknown>;
}

describe("PlayerDaemon", () => {
  it("removes stale pid and socket files, writes its pid, and cleans up on stop", async () => {
    const dir = await mkdtemp(join(tmpdir(), "groovenet-daemon-"));
    const paths = { socketPath: join(dir, "player.sock"), pidPath: join(dir, "player.pid") };
    await writeFile(paths.pidPath, "99999999\n");
    await writeFile(paths.socketPath, "stale");
    const server = new FakeServer();
    const daemon = new PlayerDaemon({
      player: makePlayer(), paths, isProcessAlive: () => false,
      createServer: ((accept: (socket: Socket) => void) => { server.accept = accept; return server; }) as unknown as typeof import("node:net").createServer,
    });
    try {
      await daemon.start();
      expect(await readFile(paths.pidPath, "utf8")).toBe(`${process.pid}\n`);
      await daemon.stop();
      await expect(readFile(paths.pidPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
      await expect(readFile(paths.socketPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally { await rm(dir, { recursive: true, force: true }); }
  });

  it("refuses to replace files when the pidfile belongs to a live daemon", async () => {
    const dir = await mkdtemp(join(tmpdir(), "groovenet-daemon-"));
    const paths = { socketPath: join(dir, "player.sock"), pidPath: join(dir, "player.pid") };
    await writeFile(paths.pidPath, "123\n");
    const processKill = vi.spyOn(process, "kill").mockImplementation(() => { throw Object.assign(new Error("permission denied"), { code: "EPERM" }); });
    const daemon = new PlayerDaemon({
      player: makePlayer(), paths,
      connectSocket: (() => {
        const socket = new FakeSocket();
        setImmediate(() => socket.emit("connect"));
        return socket as unknown as Socket;
      }),
    });
    try {
      await expect(daemon.start()).rejects.toThrow("already appears to be running (pid 123)");
      expect(await readFile(paths.pidPath, "utf8")).toBe("123\n");
    } finally { processKill.mockRestore(); await rm(dir, { recursive: true, force: true }); }
  });

  it("returns a clear error for a mismatched protocol version", async () => {
    const dir = await mkdtemp(join(tmpdir(), "groovenet-daemon-"));
    const paths = { socketPath: join(dir, "player.sock"), pidPath: join(dir, "player.pid") };
    const server = new FakeServer();
    const daemon = new PlayerDaemon({
      player: makePlayer(), paths,
      createServer: ((accept: (socket: Socket) => void) => { server.accept = accept; return server; }) as unknown as typeof import("node:net").createServer,
    });
    try {
      await daemon.start();
      const socket = new FakeSocket();
      server.accept?.(socket as unknown as Socket);
      socket.emit("data", Buffer.from(JSON.stringify({ jsonrpc: "2.0", version: 8, id: 42, method: "status" }) + "\n"));
      await new Promise((resolve) => setImmediate(resolve));
      expect(JSON.parse(socket.responses[0]!)).toMatchObject({ id: 42, error: { code: "VERSION_MISMATCH", message: expect.stringContaining("supports version 1") } });
      await daemon.stop();
    } finally { await rm(dir, { recursive: true, force: true }); }
  });

  it("dispatches playback, queue, device and validation methods", async () => {
    const track = { track_id: "track-1", friend_id: 1, title: "Blue Train", local_audio_url: "blue-train.mp3" } as Track;
    const backend = new TestPlaybackBackend();
    backend.devices = [{ id: "airplay", name: "Living room" }];
    const { dir, server, daemon, player } = await makeDaemon(makePlayer(async () => ({ tracks: [track] }), backend));
    const socket = new FakeSocket();
    const request = (id: number, method: string, params: Record<string, unknown> = {}) => ({ jsonrpc: "2.0", version: 1, id, method, params });
    try {
      await daemon.start();
      server.accept?.(socket as unknown as Socket);
      expect((await send(socket, request(1, "status"))).result).toMatchObject({ status: "stopped" });
      expect((await send(socket, request(2, "queue.add", { query: "blue train" }))).result).toHaveLength(1);
      expect((await send(socket, request(21, "queue.addTrack", { track }))).result).toHaveLength(1);
      const id = player.snapshot.queue[0]!.id;
      expect((await send(socket, request(3, "queue.list"))).result).toHaveLength(2);
      expect((await send(socket, request(4, "play"))).result).toMatchObject({ status: "playing" });
      expect((await send(socket, request(41, "play", { index: "bad" }))).error).toMatchObject({ message: "Playback index must be a non-negative integer." });
      expect((await send(socket, request(5, "pause"))).result).toMatchObject({ status: "paused" });
      expect((await send(socket, request(6, "play"))).result).toMatchObject({ status: "playing" });
      expect((await send(socket, request(61, "resume"))).result).toMatchObject({ status: "playing" });
      expect((await send(socket, request(62, "next"))).result).toMatchObject({ status: "playing" });
      expect((await send(socket, request(63, "prev"))).result).toMatchObject({ status: "playing" });
      backend.finish();
      await new Promise((resolve) => setImmediate(resolve));
      expect(socket.responses.some((line) => line.includes('"event":"track-ended"'))).toBe(true);
      expect((await send(socket, request(7, "seek", { seconds: 12 }))).result).toMatchObject({ position: 12 });
      expect((await send(socket, request(8, "volume", { volume: 41 }))).result).toMatchObject({ volume: 41 });
      expect((await send(socket, request(9, "devices"))).result).toEqual([{ id: "airplay", name: "Living room" }]);
      expect((await send(socket, request(91, "devices.select", { id: "airplay" }))).result).toEqual([{ id: "airplay", name: "Living room" }]);
      expect((await send(socket, request(10, "queue.remove", { id }))).result).toMatchObject({ id });
      expect((await send(socket, request(11, "queue.remove", { index: 99 }))).error).toMatchObject({ code: "PLAYER_ERROR" });
      expect((await send(socket, request(12, "queue.add"))).error).toMatchObject({ code: "PLAYER_ERROR" });
      expect((await send(socket, request(13, "unknown"))).error).toMatchObject({ message: expect.stringContaining("Unknown player command") });
      player.add([{ ...track, local_audio_url: undefined }]);
      await send(socket, request(131, "play", { index: 1 }));
      expect(socket.responses.some((line) => line.includes('"event":"error"'))).toBe(true);
      expect((await send(socket, "not json")).error).toMatchObject({ code: "INVALID_REQUEST" });
      expect((await send(socket, { ...request(14, "status"), jsonrpc: "1.0" })).error).toMatchObject({ code: "INVALID_REQUEST" });
      expect((await send(socket, request(15, "shutdown"))).result).toEqual({ stopping: true });
    } finally { await daemon.stop(); await rm(dir, { recursive: true, force: true }); }
  });

  it("cleans up after listen failure", async () => {
    const { dir, daemon, server } = await makeDaemon();
    server.failListen = true;
    try {
      await expect(daemon.start()).rejects.toThrow("listen failed");
    } finally { await rm(dir, { recursive: true, force: true }); }
  });

  it("stops cleanly if runtime files are already gone", async () => {
    const { dir, paths, daemon } = await makeDaemon();
    try {
      await daemon.start();
      await unlink(paths.pidPath);
      await daemon.stop();
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
});
