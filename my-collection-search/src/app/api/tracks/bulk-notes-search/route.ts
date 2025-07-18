import { NextResponse } from "next/server";

interface SearchOptions {
  filter: string;
  limit: number;
}

export async function GET(request: Request) {
  const { getMeiliClient } = await import("@/lib/meili");
  const meiliClient = getMeiliClient({ server: true });

  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const artist = searchParams.get("artist");
    // Only fetch tracks missing notes or local_tags (MeiliSearch filter syntax)
    // If your MeiliSearch version supports _missing, you can use it. Otherwise, just check for empty string.
    const filter = [
      "(notes IS NULL OR notes IS EMPTY OR notes = '' OR local_tags IS NULL OR local_tags IS EMPTY)",
    ];
    if (username) filter.push(`username = '${username.replace(/'/g, "''")}'`);

    const searchOptions: SearchOptions = {
      filter: filter.join(" AND "),
      limit: 200,
    };
    let q = "";
    if (artist) q = artist;

    const index = meiliClient.index("tracks");
    const result = await index.search(q, searchOptions);
    console.debug("Search result:", result);
    return NextResponse.json({ tracks: result.hits });
  } catch (error) {
    console.error("Error in bulk-notes-search:", error);
    return NextResponse.json(
      { error: "Failed to search tracks" },
      { status: 500 }
    );
  }
}
