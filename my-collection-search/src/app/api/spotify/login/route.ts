import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const urlState = url.searchParams.get("state");
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  const scopes = [
    "user-library-read",
    "playlist-read-private",
    "playlist-read-collaborative",
  ];
  const authUrl =
    `https://accounts.spotify.com/authorize?response_type=code` +
    `&client_id=${encodeURIComponent(clientId ?? "")}` +
    `&scope=${encodeURIComponent(scopes.join(" "))}` +
    `&redirect_uri=${encodeURIComponent(redirectUri ?? "")}` +
    `&state=${encodeURIComponent(urlState ?? "")}`;
  return NextResponse.redirect(authUrl);
}
