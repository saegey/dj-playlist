import { NextResponse } from "next/server";
import { trackRepository } from "@/server/repositories/trackRepository";

export async function GET() {
  try {
    const tracks = await trackRepository.getAllTracksWithLibraryIdentifier();
    return NextResponse.json(tracks);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 });
  }
}
