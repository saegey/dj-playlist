import { Pool } from "pg";
import { NextRequest, NextResponse } from "next/server";
import { TextEncoder } from "util";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
  try {
    // Next.js API Route Request may have nextUrl property for URL parsing
    const searchParams = request.nextUrl.searchParams;
    const showCurrentUser = searchParams.get("showCurrentUser") === "true"; // example usage
    const showSpotifyUsernames =
      searchParams.get("showSpotifyUsernames") === "true";

    let rows;
    if (showCurrentUser) {
      console.debug("Fetching all friends including current user");
      ({ rows } = await pool.query(
        "SELECT username FROM friends ORDER BY added_at DESC"
      ));
      rows.push({
        username: process.env.DISCOGS_USERNAME,
      });
    } else {
      console.debug("Fetching all friends excluding current user");
      ({ rows } = await pool.query(
        "SELECT username FROM friends WHERE username <> $1 ORDER BY added_at DESC",
        [process.env.DISCOGS_USERNAME]
      ));
    }

    // Add Spotify usernames from manifest files
    if (showSpotifyUsernames) {
      console.debug("Including Spotify usernames from manifest files");
      try {
        const fs = await import("fs");
        const path = await import("path");
        const EXPORT_DIR = path.resolve(process.cwd(), "spotify_exports");
        const manifestFiles = fs
          .readdirSync(EXPORT_DIR)
          .filter((f) => f.startsWith("manifest_") && f.endsWith(".json"));
        for (const manifestFile of manifestFiles) {
          try {
            const manifestRaw = fs.readFileSync(
              path.join(EXPORT_DIR, manifestFile),
              "utf-8"
            );
            const manifest = JSON.parse(manifestRaw);
            if (
              manifest.spotifyUsername &&
              typeof manifest.spotifyUsername === "string"
            ) {
              if (!rows.some((r) => r.username === manifest.spotifyUsername)) {
                rows.push({ username: manifest.spotifyUsername });
              }
            }
          } catch {}
        }
      } catch {}
    }

    const friends = rows.map((r) => r.username);
    return NextResponse.json({ friends });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = body?.username;
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid username" },
        { status: 400 }
      );
    }
    await pool.query(
      "INSERT INTO friends (username) VALUES ($1) ON CONFLICT DO NOTHING",
      [username]
    );
    return NextResponse.json({ message: `Friend '${username}' added.` });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const url = new URL(request.url);
        const username = url.searchParams.get("username");
        if (!username || typeof username !== "string") {
          controller.enqueue(encoder.encode("Missing or invalid username\n"));
          controller.close();
          return;
        }

        // Remove manifest and release files
        try {
          const {
            getManifestPath,
            getManifestReleaseIds,
            getReleasePath,
            DISCOGS_EXPORTS_DIR,
          } = await import("@/services/discogsManifestService");
          const fs = await import("fs");
          const path = await import("path");
          // Delete manifest file
          const manifestPath = getManifestPath(username);
          if (fs.existsSync(manifestPath)) {
            fs.unlinkSync(manifestPath);
            controller.enqueue(
              encoder.encode(`Deleted manifest: ${manifestPath}\n`)
            );
          } else {
            controller.enqueue(
              encoder.encode(`Manifest not found: ${manifestPath}\n`)
            );
          }
          // Delete all release files for this user
          const releaseIds = getManifestReleaseIds(username);
          for (const releaseId of releaseIds) {
            const releasePath = getReleasePath(username, releaseId);
            if (releasePath && fs.existsSync(releasePath)) {
              fs.unlinkSync(releasePath);
              controller.enqueue(
                encoder.encode(`Deleted release: ${releasePath}\n`)
              );
            } else if (releasePath) {
              controller.enqueue(
                encoder.encode(`Release not found: ${releasePath}\n`)
              );
            }
          }
          // Also delete any files matching `${username}_release_*.json` (legacy)
          const files = fs.readdirSync(DISCOGS_EXPORTS_DIR);
          for (const file of files) {
            if (
              file.startsWith(`${username}_release_`) &&
              file.endsWith(".json")
            ) {
              fs.unlinkSync(path.join(DISCOGS_EXPORTS_DIR, file));
              controller.enqueue(
                encoder.encode(`Deleted legacy release: ${file}\n`)
              );
            }
          }
        } catch (e) {
          controller.enqueue(
            encoder.encode(
              `Error deleting manifest/release files: ${
                e instanceof Error ? e.message : String(e)
              }\n`
            )
          );
        }

        // Remove from MeiliSearch
        try {
          const { getMeiliClient } = await import("@/lib/meili");
          const meiliClient = getMeiliClient();
          const index = meiliClient.index("tracks");
          await index.deleteDocuments({ filter: `username = '${username}'` });
          controller.enqueue(
            encoder.encode(
              `Deleted tracks from MeiliSearch for user: ${username}\n`
            )
          );
        } catch (e) {
          controller.enqueue(
            encoder.encode(
              `Error deleting from MeiliSearch: ${
                e instanceof Error ? e.message : String(e)
              }\n`
            )
          );
        }

        // Remove from Postgres tracks table (if you store per-user tracks)
        try {
          await pool.query("DELETE FROM tracks WHERE username = $1", [
            username,
          ]);
          controller.enqueue(
            encoder.encode(
              `Deleted tracks from Postgres for user: ${username}\n`
            )
          );
        } catch (e) {
          controller.enqueue(
            encoder.encode(
              `Error deleting user tracks from Postgres: ${
                e instanceof Error ? e.message : String(e)
              }\n`
            )
          );
        }

        // Remove from friends table
        await pool.query("DELETE FROM friends WHERE username = $1", [username]);
        controller.enqueue(encoder.encode(`Deleted friend: ${username}\n`));

        controller.enqueue(encoder.encode(`DONE\n`));
        controller.close();
      } catch (e) {
        controller.enqueue(
          encoder.encode(
            `Error: ${e instanceof Error ? e.message : String(e)}\n`
          )
        );
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Transfer-Encoding": "chunked",
    },
    status: 200,
  });
}
