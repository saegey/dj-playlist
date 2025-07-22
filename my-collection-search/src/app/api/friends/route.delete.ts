import { Pool } from "pg";
import { NextResponse } from "next/server";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get("username");
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Missing or invalid username" }, { status: 400 });
    }
    await pool.query("DELETE FROM friends WHERE username = $1", [username]);
    return NextResponse.json({ message: `Friend '${username}' removed.` });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
