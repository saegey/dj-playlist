import { Pool } from "pg";
import { NextRequest, NextResponse } from "next/server";

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
