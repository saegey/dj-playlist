import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SpotifyApiTrack } from "@/types/track";

// TypeScript type for a Spotify track search result
export type SpotifyTrackSearchResult = {
  id: string;
  title: string;
  artist: string;
  album: string;
  url: string;
  artwork: string;
  duration: number;
};

export async function POST(request: Request) {
  try {
    const { title, artist } = await request.json();
    if (!title && !artist) {
      return NextResponse.json(
        { error: "Missing title or artist" },
        { status: 400 }
      );
    }
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("spotify_access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing Spotify access token" },
        { status: 401 }
      );
    }
    // Build Spotify search query
    let q = "";
    if (title) q += `track:${title}`;
    if (artist) q += (q ? " " : "") + `artist:${artist}`;
    const params = new URLSearchParams({
      q,
      type: "track",
      limit: "10",
    });
    const res = await fetch(
      `https://api.spotify.com/v1/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: err.error?.message || "Spotify API error" },
        { status: res.status }
      );
    }
    const data = await res.json();
    // Map results to a simple shape
    const results = (data.tracks?.items || []).map((t: SpotifyApiTrack) => ({
      id: t.id,
      title: t.name,
      artist: t.artists.map((a) => a.name).join(", "),
      album: t.album.name,
      url: t.external_urls.spotify,
      artwork: t.album.images?.[0]?.url,
      duration: t.duration_ms,
    }));
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Error searching Spotify tracks:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
