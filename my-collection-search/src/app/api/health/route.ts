import { NextResponse } from "next/server";

// Lightweight liveness probe for container HEALTHCHECK / monitoring (beszel).
// Intentionally does no DB/Redis work so it stays fast and reflects only that
// the Next.js server is up and serving.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
