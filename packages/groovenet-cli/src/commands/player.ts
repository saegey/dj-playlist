import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { GroovenetClient, loadConfig } from "@groovenet/client";
import { MpvBackend, PlayerControlClient, PlayerCore, PlayerDaemon, TrackResolver } from "@groovenet/player";
import { printError, printJson, printSuccess } from "../output.js";

const playerDir = join(homedir(), ".groovenet", "player");
const paths = { socketPath: join(playerDir, "player.sock"), pidPath: join(playerDir, "player.pid") };

function createDaemon(): PlayerDaemon {
  const config = loadConfig();
  const client = new GroovenetClient({ baseUrl: config.api_base, apiKey: config.api_key, insecureTls: config.insecure_tls, clientName: "cli" });
  const player = new PlayerCore(
    new MpvBackend({ insecureTls: config.insecure_tls }),
    new TrackResolver(client, { apiBase: config.api_base, apiKey: config.api_key })
  );
  return new PlayerDaemon({ player, paths });
}

async function reportFailure(action: () => Promise<unknown>, json: boolean): Promise<void> {
  try {
    const result = await action();
    if (result !== undefined) printPlayerResult(result, json);
  } catch (error) {
    printError(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

function printPlayerResult(result: unknown, json: boolean): void {
  if (json) { printJson(result); return; }
  if (Array.isArray(result)) {
    if (result.length === 0) { console.log("No entries."); return; }
    for (const [index, item] of result.entries()) {
      const entry = item as { id?: string; name?: string; description?: string; track?: { title?: string; artist?: string } };
      if (entry.track) console.log(`${index + 1}. ${entry.track.title ?? "Unknown track"} — ${entry.track.artist ?? "Unknown artist"} [${entry.id ?? ""}]`);
      else console.log(`${index + 1}. ${entry.name ?? "Unknown device"}${entry.description ? ` — ${entry.description}` : ""} [${entry.id ?? ""}]`);
    }
    return;
  }
  if (typeof result === "object" && result !== null && "status" in result) {
    const snapshot = result as { status: string; current?: { track?: { title?: string; artist?: string } } | null; position?: number; duration?: number | null; volume?: number };
    console.log(`Status: ${snapshot.status}${snapshot.current?.track ? ` — ${snapshot.current.track.title ?? "Unknown track"} / ${snapshot.current.track.artist ?? "Unknown artist"}` : ""}`);
    if (snapshot.position !== undefined) console.log(`Position: ${Math.floor(snapshot.position)}s${snapshot.duration == null ? "" : ` / ${Math.floor(snapshot.duration)}s`}`);
    if (snapshot.volume !== undefined) console.log(`Volume: ${snapshot.volume}%`);
    return;
  }
}

async function withClient<T>(action: (client: PlayerControlClient) => Promise<T>): Promise<T> {
  const client = new PlayerControlClient(paths.socketPath);
  try { return await action(client); } finally { await client.close(); }
}

export function addPlayerCommands(program: Command): void {
  const player = program.command("player").description("Control headless audio playback");
  player.command("start")
    .description("Start the playback daemon")
    .option("--detach", "run the daemon in the background")
    .option("--json", "print machine-readable output")
    .action(async (options: { detach?: boolean; json?: boolean }) => reportFailure(async () => {
      if (options.detach) {
        const executable = process.argv[1];
        if (!executable) throw new Error("Could not locate the Groovenet CLI entry point.");
        const spawnError: { current: Error | null } = { current: null };
        const child = spawn(process.execPath, [executable, "player", "_daemon"], { detached: true, stdio: "ignore", env: process.env });
        child.once("error", (error) => { spawnError.current = error; });
        child.unref();
        const deadline = Date.now() + 5000;
        let lastError: unknown;
        while (Date.now() < deadline) {
          if (spawnError.current) throw new Error(`Could not start the player daemon: ${spawnError.current.message}`);
          try {
            const status = await withClient((control) => control.request("status"));
            return options.json ? { started: true, status } : (printSuccess("Player daemon started."), undefined);
          } catch (error) {
            lastError = error;
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }
        throw new Error(`Player daemon did not start: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
      }
      const daemon = createDaemon();
      await daemon.start();
      if (options.json) printJson({ started: true, pid: process.pid }); else printSuccess("Player daemon running. Press Ctrl+C to stop.");
      await new Promise<void>((resolve) => {
        const shutdown = () => {
          process.off("SIGINT", shutdown);
          process.off("SIGTERM", shutdown);
          void daemon.stop().finally(resolve);
        };
        process.once("SIGINT", shutdown);
        process.once("SIGTERM", shutdown);
      });
      return undefined;
    }, options.json ?? false));

  player.command("_daemon").description("Internal daemon process").action(async () => {
    try {
      const daemon = createDaemon();
      await daemon.start();
      const shutdown = () => {
        process.off("SIGINT", shutdown);
        process.off("SIGTERM", shutdown);
        void daemon.stop();
      };
      process.once("SIGINT", shutdown);
      process.once("SIGTERM", shutdown);
    } catch (error) {
      printError(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

  player.command("stop")
    .description("Stop the playback daemon")
    .option("--json", "print machine-readable output")
    .action(async (options: { json?: boolean }) => reportFailure(() => withClient(async (client) => {
      const result = await client.request("shutdown");
      if (!options.json) { printSuccess("Player daemon stopped."); return undefined; }
      return result;
    }), options.json ?? false));

  player.command("status").description("Show playback status").option("--json", "print machine-readable output")
    .action(async (options: { json?: boolean }) => reportFailure(() => withClient((client) => client.request("status")), options.json ?? false));
  player.command("play [index]").description("Start or resume playback")
    .option("--json", "print machine-readable output")
    .action(async (index: string | undefined, options: { json?: boolean }) => reportFailure(() => withClient((client) => client.request(index === undefined ? "play" : "play", index === undefined ? undefined : { index: Number(index) })), options.json ?? false));
  player.command("pause").description("Pause playback").option("--json", "print machine-readable output")
    .action(async (options: { json?: boolean }) => reportFailure(() => withClient(async (client) => {
      const status = await client.request<{ status: string }>("status");
      return client.request(status.status === "paused" ? "resume" : "pause");
    }), options.json ?? false));
  player.command("next").description("Skip to the next track").option("--json", "print machine-readable output")
    .action(async (options: { json?: boolean }) => reportFailure(() => withClient((client) => client.request("next")), options.json ?? false));
  player.command("prev").description("Play the previous track").option("--json", "print machine-readable output")
    .action(async (options: { json?: boolean }) => reportFailure(() => withClient((client) => client.request("prev")), options.json ?? false));
  player.command("seek <seconds>").description("Seek to a position in seconds").option("--json", "print machine-readable output")
    .action(async (seconds: string, options: { json?: boolean }) => reportFailure(() => withClient((client) => client.request("seek", { seconds: Number(seconds) })), options.json ?? false));
  player.command("volume <level>").description("Set volume from 0 to 100").option("--json", "print machine-readable output")
    .action(async (level: string, options: { json?: boolean }) => reportFailure(() => withClient((client) => client.request("volume", { volume: Number(level) })), options.json ?? false));

  const queue = player.command("queue").description("Manage the playback queue");
  queue.command("add [query]").description("Search for tracks or add a playlist to the queue")
    .option("--playlist <id>", "add tracks from a playlist")
    .option("--json", "print machine-readable output")
    .action(async (query: string | undefined, options: { playlist?: string; json?: boolean }) => reportFailure(() => withClient((client) => client.request("queue.add", options.playlist ? { playlistId: options.playlist } : { query })), options.json ?? false));
  queue.command("remove <id-or-index>").description("Remove a queue entry by id or zero-based index")
    .option("--json", "print machine-readable output")
    .action(async (value: string, options: { json?: boolean }) => reportFailure(() => withClient((client) => client.request("queue.remove", /^\d+$/.test(value) ? { index: Number(value) } : { id: value })), options.json ?? false));
  queue.command("list").description("Show the playback queue").option("--json", "print machine-readable output")
    .action(async (options: { json?: boolean }) => reportFailure(() => withClient((client) => client.request("queue.list")), options.json ?? false));
  player.command("devices").description("List available audio outputs").option("--json", "print machine-readable output")
    .action(async (options: { json?: boolean }) => reportFailure(() => withClient((client) => client.request("devices")), options.json ?? false));
}
