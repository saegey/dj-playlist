import { NextRequest, NextResponse } from "next/server";
import type { Track } from "@/types/track";
import { getMeiliClient } from "@/lib/meili";

const client = getMeiliClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const filter = searchParams.get("filter");

    const index = client.index<Track>("tracks");

    const searchOptions: any = {
      limit,
      offset,
    };

    if (filter) {
      searchOptions.filter = filter;
    }

    const results = await index.search(q, searchOptions);

    return NextResponse.json({
      hits: results.hits,
      estimatedTotalHits: results.estimatedTotalHits,
      offset: results.offset,
      limit: results.limit,
      processingTimeMs: results.processingTimeMs,
    });
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query = "", limit = 20, offset = 0, filters } = body;

    const index = client.index<Track>("tracks");

    // Build filter array
    const filterArray: string[] = [];

    if (filters) {
      if (filters.bpm_min) filterArray.push(`bpm >= ${filters.bpm_min}`);
      if (filters.bpm_max) filterArray.push(`bpm <= ${filters.bpm_max}`);
      if (filters.key) filterArray.push(`key = "${filters.key}"`);
      if (filters.star_rating)
        filterArray.push(`star_rating >= ${filters.star_rating}`);
      if (filters.friend_id)
        filterArray.push(`friend_id = ${filters.friend_id}`);
    }

    const searchOptions: any = {
      limit,
      offset,
    };

    if (filterArray.length > 0) {
      searchOptions.filter = filterArray;
    }

    const results = await index.search(query, searchOptions);

    return NextResponse.json({
      tracks: results.hits,
      estimatedTotalHits: results.estimatedTotalHits,
      offset: results.offset,
      limit: results.limit,
      processingTimeMs: results.processingTimeMs,
    });
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}
