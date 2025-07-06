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
    const { title, artist } = await req.json();
    const developerToken = generateAppleMusicDeveloperToken();
    const query = encodeURIComponent(`${title} ${artist}`);
    const url = `${APPLE_MUSIC_API_URL}?term=${query}&types=songs&limit=5`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${developerToken}` },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Apple Music API error" }, { status: 500 });
    }
    const data = await res.json();
    const songs = data?.results?.songs?.data || [];
    // Map to a simple structure for the UI
    const results = songs.map((song: any) => ({
      id: song.id,
      title: song.attributes?.name,
      artist: song.attributes?.artistName,
      album: song.attributes?.albumName,
      url: song.attributes?.url,
      artwork: song.attributes?.artwork?.url,
      duration: song.attributes?.durationInMillis
    }));
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching Apple Music:", error);
    return NextResponse.json({ error: "Failed to search Apple Music" }, { status: 500 });
  }
}
