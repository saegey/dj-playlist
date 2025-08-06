
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import { SpotifyTrack } from "@/types/track";
const OUTPUT_DIR = path.resolve(process.cwd(), "spotify_exports");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest_spotify.json");

function loadManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    const data = fs.readFileSync(MANIFEST_PATH, "utf-8");
    const manifest = JSON.parse(data);
    return manifest.trackIds || [];
  }
  return [];
}

function saveManifest(trackIds: string[], spotifyUsername?: string) {
  const manifest = {
    trackIds: Array.from(new Set(trackIds)),
    lastSynced: new Date().toISOString(),
    ...(spotifyUsername ? { spotifyUsername } : {}),
  };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

export async function GET(request: Request) {
  // Get spotify_username from query param
  let spotifyUsername = undefined;
  if (request && typeof request.url === "string") {
    try {
      const urlObj = new URL(request.url, "http://localhost");
      spotifyUsername = urlObj.searchParams.get("spotify_username") || undefined;
    } catch {}
  }
  // Get access token from cookie
  const cookieStore = cookies();
  const accessToken = (await cookieStore).get("spotify_access_token")?.value;
  if (!accessToken) {
    return new NextResponse(JSON.stringify({ error: "Not authenticated with Spotify. Please log in first." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  // Load manifest
  const manifestIds = loadManifest();
  const allIds: string[] = [];
  const newTracks: string[] = [];
  const errors: { trackId: string; error: string }[] = [];

  let url = "https://api.spotify.com/v1/me/tracks?limit=50";
  try {
    while (url) {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const err = await res.json();
        return new NextResponse(JSON.stringify({ error: err.error?.message || "Spotify API error" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      for (const item of data.items as SpotifyTrack[]) {
        const trackId = item.track.id;
        allIds.push(trackId);
        if (!manifestIds.includes(trackId)) {
          try {
            const filePath = path.join(OUTPUT_DIR, `track_${trackId}.json`);
            fs.writeFileSync(filePath, JSON.stringify(item, null, 2));
            newTracks.push(trackId);
          } catch (e) {
            errors.push({ trackId, error: (e as Error).message });
          }
        }
      }
      url = data.next;
      // Wait to avoid hitting rate limits
      await new Promise(r => setTimeout(r, 1200));
    }
    // Update and save manifest, now with spotifyUsername
    saveManifest([...manifestIds, ...newTracks], spotifyUsername);
    return new NextResponse(JSON.stringify({
      message: "Spotify sync complete",
      newTracks,
      alreadyHave: manifestIds,
      errors,
      totalLibrary: allIds.length,
      newCount: newTracks.length,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const errorMessage =
      typeof e === "object" && e !== null && "message" in e
        ? (e as { message?: string }).message
        : String(e);
    return new NextResponse(JSON.stringify({ error: errorMessage, newTracks, errors }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
