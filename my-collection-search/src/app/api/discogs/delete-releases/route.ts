import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import {
  deleteRelease,
  getManifestPath,
  getManifestReleaseIds,
  saveManifest,
  parseManifestFile,
  getManifestFiles,
} from "@/services/discogsManifestService";
import { getMeiliClient } from "@/lib/meili";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface DeleteReleasesRequest {
  username: string;
  releaseIds: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: DeleteReleasesRequest = await request.json();
    const { username, releaseIds } = body;

    if (!username || !Array.isArray(releaseIds)) {
      return NextResponse.json(
        { error: "username and releaseIds array required" },
        { status: 400 }
      );
    }

    const deletedFiles: string[] = [];
    const failedDeletes: string[] = [];
    const deletedTrackIds: string[] = [];

    // Step 1: Delete local JSON files
    for (const releaseId of releaseIds) {
      const success = deleteRelease(username, releaseId);
      if (success) {
        deletedFiles.push(releaseId);
      } else {
        failedDeletes.push(releaseId);
      }
    }

    // Step 2: Update manifest - move to deletedReleaseIds
    const manifestPath = getManifestPath(username);
    const currentIds = getManifestReleaseIds(username);
    const remainingIds = currentIds.filter((id) => !releaseIds.includes(id));

    // Read existing deleted IDs
    let existingDeletedIds: string[] = [];
    try {
      const manifestFiles = getManifestFiles();
      const manifestFile = manifestFiles.find((f) => {
        const { username: u } = parseManifestFile(f);
        return u === username;
      });
      if (manifestFile) {
        const { manifest } = parseManifestFile(manifestFile);
        existingDeletedIds = manifest.deletedReleaseIds || [];
      }
    } catch {
      // ignore
    }

    const allDeletedIds = [...existingDeletedIds, ...releaseIds];
    saveManifest(manifestPath, remainingIds, allDeletedIds);

    // Step 3: Delete from PostgreSQL
    // Get all track_ids for these releases
    const trackIdsQuery = `
      SELECT track_id FROM tracks
      WHERE track_id LIKE ANY($1) AND friend_id = (
        SELECT id FROM friends WHERE username = $2
      )
    `;
    const patterns = releaseIds.map((id) => `${id}-%`);
    const trackIdsResult = await pool.query(trackIdsQuery, [patterns, username]);
    const trackIds = trackIdsResult.rows.map((row) => row.track_id);
    deletedTrackIds.push(...trackIds);

    if (trackIds.length > 0) {
      const deleteQuery = `
        DELETE FROM tracks
        WHERE track_id = ANY($1) AND friend_id = (
          SELECT id FROM friends WHERE username = $2
        )
      `;
      await pool.query(deleteQuery, [trackIds, username]);
    }

    // Step 4: Delete from Meilisearch using filter on track_id
    let meiliDeletedCount = 0;
    if (trackIds.length > 0) {
      const meiliClient = getMeiliClient();
      const index = meiliClient.index("tracks");

      // Delete by filtering on track_id field
      // Build filter: track_id = "123-1" OR track_id = "123-2" OR ...
      const filterParts = trackIds.map((id) => `track_id = "${id}"`);
      const filter = filterParts.join(" OR ");

      console.log("[Delete Releases] Deleting from Meilisearch by filter, track_ids:", trackIds);
      const deleteTask = await index.deleteDocuments({
        filter: filter,
      });
      console.log("[Delete Releases] Meilisearch delete task enqueued:", deleteTask);

      // Meilisearch processes deletions asynchronously
      // The deletion will complete in the background
      meiliDeletedCount = trackIds.length;
    }

    return NextResponse.json({
      message: `Deleted ${releaseIds.length} releases`,
      deletedFiles,
      failedDeletes,
      deletedTrackIds,
      deletedFromDb: trackIds.length,
      deletedFromMeili: meiliDeletedCount,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("[Delete Releases Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
