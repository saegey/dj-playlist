import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

const APPLE_MUSIC_API_URL = "https://api.music.apple.com/v1/catalog/us/search";

function generateAppleMusicDeveloperToken() {
  const teamId = process.env.APPLE_MUSIC_TEAM_ID;
  const keyId = process.env.APPLE_MUSIC_KEY_ID;
  const privateKeyPath = process.env.APPLE_MUSIC_PRIVATE_KEY_PATH || path.resolve(process.cwd(), `AuthKey_${keyId}.p8`);
  if (!teamId || !keyId || !privateKeyPath) {
    throw new Error("Missing Apple Music credentials (TEAM_ID, KEY_ID, or PRIVATE_KEY_PATH)");
  }
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 60 * 60 * 24 * 180, // 6 months
  };
  const header = {
    alg: "ES256",
    kid: keyId,
  };
  return jwt.sign(payload, privateKey, {
    algorithm: "ES256",
    header,
  });
}

export async function POST(req: Request) {
  try {
    const { title, artist, album, isrc } = await req.json();
    const developerToken = generateAppleMusicDeveloperToken();
    // Build a query string with as much info as possible
    let query = `${title || ''} ${artist || ''}`.trim();
    if (album) query += ` ${album}`;
    let url = `${APPLE_MUSIC_API_URL}?term=${encodeURIComponent(query)}&types=songs&limit=10`;
    if (isrc) {
      // Try ISRC search first (if provided)
      url = `${APPLE_MUSIC_API_URL}?term=${encodeURIComponent(isrc)}&types=songs&limit=5`;
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${developerToken}` },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Apple Music API error" }, { status: 500 });
    }
    const data = await res.json();
    const songs = data?.results?.songs?.data || [];
    // Optionally, filter by ISRC if provided
    let filtered = songs;
    if (isrc) {
      filtered = songs.filter((song: any) => song.attributes?.isrc?.toUpperCase() === isrc.toUpperCase());
    }
    // Map to a simple structure for the UI
    const results = filtered.map((song: any) => ({
      id: song.id,
      title: song.attributes?.name,
      artist: song.attributes?.artistName,
      album: song.attributes?.albumName,
      url: song.attributes?.url,
      artwork: song.attributes?.artwork?.url,
      duration: song.attributes?.durationInMillis,
      isrc: song.attributes?.isrc
    }));
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching Apple Music:", error);
    return NextResponse.json({ error: "Failed to search Apple Music" }, { status: 500 });
  }
}
