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
    console.log("[spotify-track-search] POST invoked");
    const referer = request.headers.get("referer");
    if (referer) console.log("[spotify-track-search] referer:", referer);
    const { title, artist } = await request.json();
    console.log("[spotify-track-search] payload:", { title, artist });
    if (!title && !artist) {
      console.warn("[spotify-track-search] Missing title AND artist");
      return NextResponse.json(
        { error: "Missing title or artist" },
        { status: 400 }
      );
    }
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("spotify_access_token")?.value;
    if (!accessToken) {
      // Provide a login URL so the client can initiate OAuth
      let state = "/settings";
      try {
        const ref = request.headers.get("referer");
        if (ref) state = new URL(ref).pathname || state;
      } catch {}
      const loginUrl = `/api/spotify/login?state=${encodeURIComponent(state)}`;
      console.warn("[spotify-track-search] Missing access token. Redirect loginUrl:", loginUrl, "state:", state);
      return NextResponse.json(
        { error: "Missing Spotify access token", loginUrl },
        { status: 401 }
      );
    }
    // Build Spotify search query
    let q = "";
    if (title) q += `track:${title}`;
    if (artist) q += (q ? " " : "") + `artist:${artist}`;
    console.log("[spotify-track-search] built query:", q);
    const params = new URLSearchParams({
      q,
      type: "track",
      limit: "10",
    });
    const url = `https://api.spotify.com/v1/search?${params.toString()}`;
    console.log("[spotify-track-search] requesting:", url);
    const res = await fetch(
      url,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    console.log("[spotify-track-search] response status:", res.status);
    if (!res.ok) {
      const err = await res.json();
      console.warn("[spotify-track-search] Spotify API error:", res.status, err);
      return NextResponse.json(
        { error: err.error?.message || "Spotify API error" },
        { status: res.status }
      );
    }
    const data = await res.json();
    const count = data?.tracks?.items?.length ?? 0;
    console.log("[spotify-track-search] results count:", count);
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
    if (results.length) {
      console.log("[spotify-track-search] first result:", {
        id: results[0].id,
        title: results[0].title,
        artist: results[0].artist,
      });
    }
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[spotify-track-search] Uncaught error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
