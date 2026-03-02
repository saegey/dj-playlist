import { Command } from "commander";
import { GroovenetClient, loadConfig } from "@groovenet/client";
import { printJson, printSuccess, printError } from "../output.js";

function makeClient(): GroovenetClient {
  const cfg = loadConfig();
  return new GroovenetClient({ baseUrl: cfg.api_base, apiKey: cfg.api_key });
}

export function addPlayCommands(program: Command): void {
  program
    .command("play <track-id>")
    .description("Play a track via MPD on the server (resolves local_audio_url, sends to MPD)")
    .option("--username <u>", "Username")
    .action(async (trackId: string, opts: { username?: string }) => {
      try {
        const client = makeClient();
        const track = await client.getTrack(trackId, opts.username);
        if (!track.local_audio_url) {
          printError(`Track "${track.title}" has no local audio file. Download it first.`);
          process.exit(1);
        }
        await client.play(track.local_audio_url);
        printSuccess(`▶ Playing: ${track.title} — ${track.artist}`);
      } catch (err: unknown) {
        printError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  program
    .command("pause")
    .description("Pause playback")
    .action(async () => {
      try {
        const client = makeClient();
        await client.pause();
        printSuccess("⏸ Paused.");
      } catch (err: unknown) {
        printError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  program
    .command("stop")
    .description("Stop playback")
    .action(async () => {
      try {
        const client = makeClient();
        await client.stop();
        printSuccess("⏹ Stopped.");
      } catch (err: unknown) {
        printError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  program
    .command("now-playing")
    .description("Show current playback status")
    .option("--json", "Output as JSON")
    .action(async (opts: { json?: boolean }) => {
      try {
        const client = makeClient();
        const status = await client.getPlaybackStatus();
        if (opts.json) {
          printJson(status);
        } else {
          console.log(`Playback enabled: ${status.enabled}`);
          if (status.status) {
            console.log("Status:", JSON.stringify(status.status, null, 2));
          }
        }
      } catch (err: unknown) {
        printError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}
