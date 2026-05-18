import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "@/lib/serverDb";
import {
  trackSearchGetQuerySchema,
  trackSearchGetResponseSchema,
  trackSearchPostBodySchema,
  trackSearchPostResponseSchema,
} from "@/api-contract/schemas";

type ParsedFilter = {
  where: string[];
  params: unknown[];
};

function parseTrackFilter(filter: string | undefined): ParsedFilter {
  if (!filter) return { where: [], params: [] };

  const where: string[] = [];
  const params: unknown[] = [];

  const friendIdMatch = filter.match(/friend_id\s*=\s*(\d+)/i);
  if (friendIdMatch) {
    params.push(Number(friendIdMatch[1]));
    where.push(`friend_id = $${params.length}`);
  }

  if (filter.includes("local_audio_url IS NULL")) {
    where.push("local_audio_url IS NULL");
  }

  if (filter.includes("(bpm IS NULL OR key IS NULL)")) {
    where.push("(bpm IS NULL OR key IS NULL)");
  }

  if (
    filter.includes(
      "(apple_music_url IS NULL AND youtube_url IS NULL AND soundcloud_url IS NULL)"
    )
  ) {
    where.push(
      "(apple_music_url IS NULL AND youtube_url IS NULL AND soundcloud_url IS NULL)"
    );
  }

  if (filter.includes("apple_music_url IS NULL")) {
    where.push("apple_music_url IS NULL");
  }
  if (filter.includes("youtube_url IS NULL")) {
    where.push("youtube_url IS NULL");
  }
  if (filter.includes("soundcloud_url IS NULL")) {
    where.push("soundcloud_url IS NULL");
  }

  return { where, params };
}

async function searchTracksPg(params: {
  q: string;
  limit: number;
  offset: number;
  where: string[];
  whereParams: unknown[];
}) {
  const startedAt = Date.now();
  const queryText = params.q.trim();
  const sqlParams: unknown[] = [...params.whereParams];
  let queryParamRef: string | null = null;
  if (queryText.length > 0) {
    queryParamRef = `$${sqlParams.length + 1}`;
    sqlParams.push(queryText);
  }

  const limitRef = `$${sqlParams.length + 1}`;
  sqlParams.push(params.limit);

  const offsetRef = `$${sqlParams.length + 1}`;
  sqlParams.push(params.offset);

  const whereClauses = [...params.where, "deleted_at IS NULL"];

  if (queryText.length > 0 && queryParamRef) {
    whereClauses.push(
      `(
        to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(artist, '') || ' ' || coalesce(album, '')) @@ plainto_tsquery('simple', ${queryParamRef})
        OR similarity(coalesce(title, ''), ${queryParamRef}) > 0.15
        OR similarity(coalesce(artist, ''), ${queryParamRef}) > 0.15
        OR similarity(coalesce(album, ''), ${queryParamRef}) > 0.15
      )`
    );
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const rankSql =
    queryParamRef
      ? `(
        ts_rank(
          to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(artist, '') || ' ' || coalesce(album, '')),
          plainto_tsquery('simple', ${queryParamRef})
        ) * 2.0
        + GREATEST(
          similarity(coalesce(title, ''), ${queryParamRef}),
          similarity(coalesce(artist, ''), ${queryParamRef}),
          similarity(coalesce(album, ''), ${queryParamRef})
        )
      )`
      : null;
  const orderBySql = rankSql ? `${rankSql} DESC, t.id DESC` : "t.id DESC";

  const { rows } = await dbQuery(
    `
    SELECT t.*
    FROM tracks t
    ${whereSql}
    ORDER BY ${orderBySql}
    LIMIT ${limitRef}
    OFFSET ${offsetRef}
    `,
    sqlParams
  );

  const countParams = queryText.length > 0 ? [...params.whereParams, queryText] : [...params.whereParams];
  const countWhereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const { rows: countRows } = await dbQuery<{ total: string }>(
    `
    SELECT COUNT(*)::text AS total
    FROM tracks
    ${countWhereSql}
    `,
    countParams
  );

  return {
    hits: rows,
    estimatedTotalHits: Number(countRows[0]?.total ?? 0),
    offset: params.offset,
    limit: params.limit,
    processingTimeMs: Date.now() - startedAt,
  };
}

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
    const parsedFilter = parseTrackFilter(filter);
    const response = await searchTracksPg({
      q,
      limit,
      offset,
      where: parsedFilter.where,
      whereParams: parsedFilter.params,
    });
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
    const where: string[] = [];
    const whereParams: unknown[] = [];

    if (filters) {
      if (filters.bpm_min !== undefined) {
        whereParams.push(filters.bpm_min);
        where.push(`bpm >= $${whereParams.length}`);
      }
      if (filters.bpm_max !== undefined) {
        whereParams.push(filters.bpm_max);
        where.push(`bpm <= $${whereParams.length}`);
      }
      if (filters.key) {
        whereParams.push(filters.key);
        where.push(`key = $${whereParams.length}`);
      }
      if (filters.star_rating !== undefined) {
        whereParams.push(filters.star_rating);
        where.push(`star_rating >= $${whereParams.length}`);
      }
      if (filters.friend_id !== undefined) {
        whereParams.push(filters.friend_id);
        where.push(`friend_id = $${whereParams.length}`);
      }
    }

    const results = await searchTracksPg({
      q: query,
      limit,
      offset,
      where,
      whereParams,
    });

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
