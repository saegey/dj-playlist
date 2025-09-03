import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getManifestFiles, getAllTracksFromManifests } from "@/services/discogsManifestService";
import { getOrCreateTracksIndex, configureMeiliIndex } from "@/services/meiliIndexService";
import { upsertTracks } from "@/services/trackUpsertService";
import { addTracksToMeili } from "@/services/meiliDocumentService";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST() {
  try {
    const { getMeiliClient } = await import("@/lib/meili");
    const meiliClient = getMeiliClient();

    // 1. Manifest/track extraction
    const manifestFiles = getManifestFiles();
    if (!manifestFiles.length) {
      return NextResponse.json(
        { error: "No manifest JSON files found" },
        { status: 404 }
      );
    }
    const allTracks = getAllTracksFromManifests();

    // 2. Meili index creation/config
    const index = await getOrCreateTracksIndex(meiliClient);
    await configureMeiliIndex(index, meiliClient);

    // 3. Upsert into Postgres
    const upserted = await upsertTracks(pool, allTracks);

    // 4. Add to Meili
    await addTracksToMeili(index, upserted);

    return NextResponse.json({
      message: `Upserted & indexed ${upserted.length} tracks.`,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
