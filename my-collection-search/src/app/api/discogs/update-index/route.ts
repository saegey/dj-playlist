import { NextResponse } from "next/server";
import { getManifestFiles, getAllTracksFromManifests } from "@/server/services/discogsManifestService";
import { upsertTracks } from "@/server/services/trackUpsertService";

export async function POST() {
  try {
    // 1. Manifest/track extraction
    const manifestFiles = getManifestFiles();
    if (!manifestFiles.length) {
      return NextResponse.json(
        { message: "No manifest files found yet. Run Discogs sync first." },
        { status: 200 }
      );
    }
    const allTracks = getAllTracksFromManifests();

    // 2. Upsert into Postgres
    const upserted = await upsertTracks(allTracks);

    return NextResponse.json({
      message: `Upserted ${upserted.length} tracks into Postgres.`,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
