import { NextResponse } from "next/server";
import { getMeiliClient } from "@/lib/meili";
import { getOrCreateTracksIndex, configureMeiliIndex } from "@/services/meiliIndexService";
import { addTracksToMeili } from "@/services/meiliDocumentService";
import { trackRepository } from "@/services/trackRepository";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "Use POST /api/tracks/reindex to rebuild the Meili tracks index from Postgres.",
    },
    { status: 200 }
  );
}

export async function POST() {
  try {
    const meiliClient = getMeiliClient();
    const index = await getOrCreateTracksIndex(meiliClient);
    await configureMeiliIndex(index, meiliClient);

    const docs = await trackRepository.listTracksForReindex();

    await index.deleteAllDocuments();
    await addTracksToMeili(index, docs);

    return NextResponse.json({
      success: true,
      indexed: docs.length,
      message: `Reindexed ${docs.length} tracks from Postgres into MeiliSearch.`,
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
