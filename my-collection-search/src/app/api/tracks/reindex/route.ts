import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getMeiliClient } from "@/lib/meili";
import { getOrCreateTracksIndex, configureMeiliIndex } from "@/services/meiliIndexService";
import { addTracksToMeili } from "@/services/meiliDocumentService";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

    const { rows } = await pool.query(`
      SELECT
        t.*,
        a.library_identifier,
        COALESCE(f.username, t.username) AS username_resolved
      FROM tracks t
      LEFT JOIN albums a
        ON t.release_id = a.release_id AND t.friend_id = a.friend_id
      LEFT JOIN friends f
        ON t.friend_id = f.id
    `);

    const docs = rows.map((row) => {
      const normalized = { ...row };
      normalized.username = row.username_resolved;
      delete normalized.username_resolved;
      return normalized;
    });

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
