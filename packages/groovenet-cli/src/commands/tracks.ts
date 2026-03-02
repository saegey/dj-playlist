import { Command } from "commander";
import { GroovenetClient, loadConfig } from "@groovenet/client";
import {
  printTracks,
  printTrack,
  printJson,
  printSuccess,
  printError,
} from "../output.js";

function makeClient(): GroovenetClient {
  const cfg = loadConfig();
  return new GroovenetClient({ baseUrl: cfg.api_base, apiKey: cfg.api_key });
}

export function addTracksCommands(program: Command): void {
  const tracks = program.command("tracks").description("Search and manage tracks");

  tracks
    .command("search <query>")
    .description("Search your collection")
    .option("--bpm-min <n>", "Minimum BPM", parseFloat)
    .option("--bpm-max <n>", "Maximum BPM", parseFloat)
    .option("--key <k>", "Musical key (e.g. 'A minor')")
    .option("--rating <n>", "Filter by star rating (0-5)", parseFloat)
    .option("--limit <n>", "Number of results", parseInt, 20)
    .option("--json", "Output as JSON")
    .action(
      async (
        query: string,
        opts: {
          bpmMin?: number;
          bpmMax?: number;
          key?: string;
          rating?: number;
          limit: number;
          json?: boolean;
        }
      ) => {
        try {
          const client = makeClient();
          const filters: Record<string, number | string> = {};
          if (opts.bpmMin != null) filters.bpm_min = opts.bpmMin;
          if (opts.bpmMax != null) filters.bpm_max = opts.bpmMax;
          if (opts.key) filters.key = opts.key;
          if (opts.rating != null) filters.star_rating = opts.rating;

          const result = await client.searchTracks({
            query,
            limit: opts.limit,
            filters: Object.keys(filters).length > 0 ? filters : undefined,
          });

          if (opts.json) {
            printJson(result);
          } else {
            console.log(
              `Found ${result.tracks.length} track(s)` +
                (result.estimatedTotalHits > result.tracks.length
                  ? ` (${result.estimatedTotalHits} total)`
                  : "")
            );
            printTracks(result.tracks, false);
          }
        } catch (err: unknown) {
          printError(err instanceof Error ? err.message : String(err));
          process.exit(1);
        }
      }
    );

  tracks
    .command("show <id>")
    .description("Show details for a track")
    .option("--username <u>", "Username")
    .option("--json", "Output as JSON")
    .action(async (id: string, opts: { username?: string; json?: boolean }) => {
      try {
        const client = makeClient();
        const track = await client.getTrack(id, opts.username);
        printTrack(track, opts.json ?? false);
      } catch (err: unknown) {
        printError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  tracks
    .command("update <id>")
    .description("Update track metadata")
    .option("--rating <n>", "Star rating (0-5)", parseFloat)
    .option("--notes <text>", "Notes")
    .option("--tags <tags>", "Comma-separated tags")
    .option("--apple-url <url>", "Apple Music URL")
    .option("--spotify-url <url>", "Spotify URL")
    .option("--youtube-url <url>", "YouTube URL")
    .option("--soundcloud-url <url>", "SoundCloud URL")
    .action(
      async (
        id: string,
        opts: {
          rating?: number;
          notes?: string;
          tags?: string;
          appleUrl?: string;
          spotifyUrl?: string;
          youtubeUrl?: string;
          soundcloudUrl?: string;
        }
      ) => {
        try {
          const client = makeClient();
          const updates: Record<string, string | number> = {};
          if (opts.rating != null) updates.star_rating = opts.rating;
          if (opts.notes) updates.notes = opts.notes;
          if (opts.tags) updates.local_tags = opts.tags;
          if (opts.appleUrl) updates.apple_music_url = opts.appleUrl;
          if (opts.spotifyUrl) updates.spotify_url = opts.spotifyUrl;
          if (opts.youtubeUrl) updates.youtube_url = opts.youtubeUrl;
          if (opts.soundcloudUrl) updates.soundcloud_url = opts.soundcloudUrl;

          if (Object.keys(updates).length === 0) {
            printError("No fields to update. Use --rating, --notes, --tags, etc.");
            process.exit(2);
          }

          await client.updateTrack(id, updates);
          printSuccess("✓ Track updated.");
        } catch (err: unknown) {
          printError(err instanceof Error ? err.message : String(err));
          process.exit(1);
        }
      }
    );

  tracks
    .command("missing-apple-music")
    .description("List tracks missing Apple Music URLs")
    .option("--page <n>", "Page number", parseInt, 1)
    .option("--page-size <n>", "Results per page", parseInt, 50)
    .option("--username <u>", "Username")
    .option("--json", "Output as JSON")
    .action(
      async (opts: {
        page: number;
        pageSize: number;
        username?: string;
        json?: boolean;
      }) => {
        try {
          const client = makeClient();
          const result = await client.getMissingAppleMusic(
            opts.page,
            opts.pageSize,
            opts.username
          );
          if (opts.json) {
            printJson(result);
          } else {
            console.log(
              `Tracks missing Apple Music URLs: ${result.total} total`
            );
            printTracks(result.tracks, false);
          }
        } catch (err: unknown) {
          printError(err instanceof Error ? err.message : String(err));
          process.exit(1);
        }
      }
    );
}
