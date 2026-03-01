import { NextResponse } from "next/server";
import { dbPool } from "@/lib/serverDb";
import { getManifestFiles, getAllTracksFromManifests } from "@/services/discogsManifestService";
import { getOrCreateTracksIndex, configureMeiliIndex } from "@/services/meiliIndexService";
import { upsertTracks } from "@/services/trackUpsertService";
import { addTracksToMeili } from "@/services/meiliDocumentService";

export async function POST() {
  try {
    const { getMeiliClient } = await import("@/lib/meili");
    const meiliClient = getMeiliClient();

    // 1. Manifest/track extraction
    const manifestFiles = getManifestFiles();
    if (!manifestFiles.length) {
      return NextResponse.json(
        { message: "No manifest files found yet. Run Discogs sync first." },
        { status: 200 }
      );
    }
    const allTracks = getAllTracksFromManifests();

    // 2. Meili index creation/config
    const index = await getOrCreateTracksIndex(meiliClient);
    await configureMeiliIndex(index, meiliClient);

    // 3. Upsert into Postgres
    const upserted = await upsertTracks(dbPool, allTracks);

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
