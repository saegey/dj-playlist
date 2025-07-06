import { NextResponse } from "next/server";

const APPLE_MUSIC_API_URL = "https://api.music.apple.com/v1/catalog/us/search";

export async function POST(req: Request) {
  try {
    const { title, artist } = await req.json();
    const developerToken = process.env.APPLE_MUSIC_DEVELOPER_TOKEN;
    if (!developerToken) {
      return NextResponse.json({ error: "Missing Apple Music developer token" }, { status: 500 });
    }
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
