import { NextRequest, NextResponse } from "next/server";
import { getPlaylistCountsForTracks } from "@/lib/db";

// POST: { track_ids: string[] }
export async function POST(req: NextRequest) {
  try {
    const { track_ids } = await req.json();
    if (!Array.isArray(track_ids) || track_ids.length === 0) {
      return NextResponse.json({}, { status: 200 });
    }
    // Returns: { [track_id]: count }
    const counts = await getPlaylistCountsForTracks(track_ids);
    return NextResponse.json(counts);
  } catch (e) {
    return NextResponse.json({ error: "Failed to get playlist counts" }, { status: 500 });
  }
}
