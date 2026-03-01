import { NextRequest, NextResponse } from "next/server";
import type { Track } from "@/types/track";
import { getMeiliClient } from "@/lib/meili";
import {
  trackSearchGetQuerySchema,
  trackSearchGetResponseSchema,
  trackSearchPostBodySchema,
  trackSearchPostResponseSchema,
} from "@/api-contract/schemas";

const client = getMeiliClient();

export async function GET(request: NextRequest) {
  try {
    const parsedQuery = trackSearchGetQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsedQuery.error.flatten(),
        },
        { status: 400 }
      );
    }
    const { q, limit, offset, filter } = parsedQuery.data;

    const index = client.index<Track>("tracks");

    const searchOptions: {
      limit: number;
      offset: number;
      filter?: string;
    } = {
      limit,
      offset,
    };

    if (filter) {
      searchOptions.filter = filter;
    }

    const results = await index.search(q, searchOptions);

    const response = {
      hits: results.hits,
      estimatedTotalHits: results.estimatedTotalHits,
      offset: results.offset,
      limit: results.limit,
      processingTimeMs: results.processingTimeMs,
    };
    const validated = trackSearchGetResponseSchema.parse(response);
    return NextResponse.json(validated);
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
    const parsedBody = trackSearchPostBodySchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }
    const { query, limit, offset, filters } = parsedBody.data;

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

    const searchOptions: {
      limit: number;
      offset: number;
      filter?: string[];
    } = {
      limit,
      offset,
    };

    if (filterArray.length > 0) {
      searchOptions.filter = filterArray;
    }

    const results = await index.search(query, searchOptions);

    const response = {
      tracks: results.hits,
      estimatedTotalHits: results.estimatedTotalHits,
      offset: results.offset,
      limit: results.limit,
      processingTimeMs: results.processingTimeMs,
    };
    const validated = trackSearchPostResponseSchema.parse(response);
    return NextResponse.json(validated);
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}
