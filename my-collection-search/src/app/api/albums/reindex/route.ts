import { NextResponse } from "next/server";
import { albumRepository } from "@/server/repositories/albumRepository";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "Use POST /api/albums/reindex to validate/rebuild Postgres-backed album search metadata.",
    },
    { status: 200 }
  );
}

export async function POST() {
  try {
    const rows = await albumRepository.listAlbumsForReindex();

    return NextResponse.json({
      success: true,
      indexed: rows.length,
      message: `Validated ${rows.length} albums available in Postgres for search.`,
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
