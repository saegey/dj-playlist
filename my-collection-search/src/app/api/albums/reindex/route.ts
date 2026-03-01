import { NextResponse } from "next/server";
import { getMeiliClient } from "@/lib/meili";
import { getOrCreateAlbumsIndex, configureAlbumsIndex } from "@/server/services/albumMeiliService";
import { albumRepository } from "@/server/repositories/albumRepository";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "Use POST /api/albums/reindex to rebuild the Meili albums index from Postgres.",
    },
    { status: 200 }
  );
}

export async function POST() {
  try {
    const meiliClient = getMeiliClient();
    const index = await getOrCreateAlbumsIndex(meiliClient);

    await configureAlbumsIndex(index);

    const rows = await albumRepository.listAlbumsForReindex();

    const docs = rows.map((row) => ({
      id: `${row.release_id}_${row.friend_id}`,
      ...row,
    }));

    await index.deleteAllDocuments();
    if (docs.length > 0) {
      await index.addDocuments(docs);
    }

    return NextResponse.json({
      success: true,
      indexed: docs.length,
      message: `Reindexed ${docs.length} albums from Postgres into MeiliSearch.`,
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
