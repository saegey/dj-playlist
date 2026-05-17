import { NextResponse } from "next/server";
import { trackRepository } from "@/server/repositories/trackRepository";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "Use POST /api/tracks/reindex to validate/rebuild Postgres-backed track search metadata.",
    },
    { status: 200 }
  );
}

export async function POST() {
  try {
    const docs = await trackRepository.listTracksForReindex();

    return NextResponse.json({
      success: true,
      indexed: docs.length,
      message: `Validated ${docs.length} tracks available in Postgres for search.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
