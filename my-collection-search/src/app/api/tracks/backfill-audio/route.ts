import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { getMeiliClient } = await import("@/lib/meili");
  const meiliClient = getMeiliClient({ server: true });

  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const artist = searchParams.get("artist");
    // Find tracks with apple_music_url or youtube_url, but no local_audio_url
    const filter = [
      "(local_audio_url IS NULL OR local_audio_url IS EMPTY OR local_audio_url = '')",
      "(apple_music_url IS NOT NULL OR youtube_url IS NOT NULL)",
    ];
    if (username) filter.push(`username = '${username.replace(/'/g, "''")}'`);
    const searchOptions: {
      filter: string;
      limit: number;
    } = {
      filter: filter.join(" AND "),
      limit: 200,
    };
    let q = "";
    if (artist) q = artist;

    const index = meiliClient.index("tracks");
    const result = await index.search(q, searchOptions);
    return NextResponse.json({ tracks: result.hits });
  } catch (error) {
    console.error("Error fetching tracks for backfill:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 }
    );
  }
}
