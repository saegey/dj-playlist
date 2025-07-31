import { Pool } from "pg";
import { NextRequest, NextResponse } from "next/server";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
  try {
    // Next.js API Route Request may have nextUrl property for URL parsing
    const searchParams = request.nextUrl.searchParams;
    const showCurrentUser = searchParams.get("showCurrentUser") === "true"; // example usage

    let rows;
    if (showCurrentUser) {
      console.debug("Fetching all friends including current user");
      ({ rows } = await pool.query(
        "SELECT username FROM friends ORDER BY added_at DESC"
      ));
      rows.push({
        username: process.env.DISCOGS_USERNAME,
      });
    } else {
      console.debug("Fetching all friends excluding current user");
      ({ rows } = await pool.query(
        "SELECT username FROM friends WHERE username <> $1 ORDER BY added_at DESC",
        [process.env.DISCOGS_USERNAME]
      ));
    }
    const friends = rows.map((r) => r.username);
    return NextResponse.json({ friends });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = body?.username;
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid username" },
        { status: 400 }
      );
    }
    await pool.query(
      "INSERT INTO friends (username) VALUES ($1) ON CONFLICT DO NOTHING",
      [username]
    );
    return NextResponse.json({ message: `Friend '${username}' added.` });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
