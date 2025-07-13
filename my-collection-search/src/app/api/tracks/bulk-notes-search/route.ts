import { NextResponse } from "next/server";
import { MeiliSearch } from "meilisearch";

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://127.0.0.1:7700",
  apiKey: process.env.MEILISEARCH_API_KEY || "masterKey",
});
const index = client.index(process.env.MEILISEARCH_INDEX || "tracks");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const artist = searchParams.get("artist");
    // Only fetch tracks missing notes or local_tags (MeiliSearch filter syntax)
    // If your MeiliSearch version supports _missing, you can use it. Otherwise, just check for empty string.
    const filter = [
      "(notes IS NULL OR notes IS EMPTY OR notes = '' OR local_tags IS NULL OR local_tags IS EMPTY)"
    ];
    if (username) filter.push(`username = '${username.replace(/'/g, "''")}'`);
    // MeiliSearch query
    const searchOptions: any = {
      filter: filter.join(" AND "),
      limit: 200,
    };
    let q = "";
    if (artist) q = artist;
    console.debug("Searching tracks with query:", q, "and options:", searchOptions);
    const result = await index.search(q, searchOptions);
    console.debug("Search result:", result);
    return NextResponse.json({ tracks: result.hits });
  } catch (error) {
    console.error("Error in bulk-notes-search:", error);
    return NextResponse.json({ error: "Failed to search tracks" }, { status: 500 });
  }
}
