import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getMeiliClient } from "@/lib/meili";
import { getOrCreateAlbumsIndex, configureAlbumsIndex } from "@/services/albumMeiliService";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

    const { rows } = await pool.query(`
      SELECT
        a.release_id,
        a.friend_id,
        f.username,
        a.title,
        a.artist,
        a.year,
        a.genres,
        a.styles,
        a.album_thumbnail,
        a.discogs_url,
        a.date_added,
        a.date_changed,
        a.track_count,
        a.album_rating,
        a.album_notes,
        a.purchase_price,
        a.condition,
        a.label,
        a.catalog_number,
        a.country,
        a.format,
        a.library_identifier
      FROM albums a
      LEFT JOIN friends f ON f.id = a.friend_id
    `);

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
