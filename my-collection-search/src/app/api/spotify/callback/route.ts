import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new NextResponse("Missing code", { status: 400 });
  }
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body:
      `grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri ?? "")}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    return new NextResponse(tokenData.error_description || "Token error", { status: 400 });
  }
  // Store access token in cookie (short-lived, for demo)
  const cookieStore = await cookies();
  cookieStore.set("spotify_access_token", tokenData.access_token, {
    httpOnly: true,
    path: "/",
    maxAge: tokenData.expires_in,
  });
  // Redirect to original page if state param is present, else fallback to /settings
  const state = url.searchParams.get("state");
  const redirectTo = state || "/settings";
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
