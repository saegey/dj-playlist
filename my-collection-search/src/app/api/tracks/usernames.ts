import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ usernames: ["saegey", "Cdsmooth", "starlustre"] });
}
