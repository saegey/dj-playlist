// pages/api/discogs/sync.js
// Next.js API route to sync Discogs collection, only downloading new releases

import {
  saveManifest,
  getReleaseWritePath,
  createExportsDir,
  getManifestReleaseIds,
  getManifestPath,
} from "@/services/discogsManifestService";
import fs from "fs";
import { NextRequest } from "next/server";
import {
  getCollectionPage,
  getReleaseDetails,
} from "@/services/discogsApiClient";

const DISCOGS_USER_TOKEN = process.env.DISCOGS_USER_TOKEN;
// Username can be passed as a param or defaults to env
function getUsernameFromRequest(request: NextRequest) {
  const url = new URL(request.url);
  const params = url.searchParams;
  return params.get("username") || process.env.DISCOGS_USERNAME;
}

export async function GET(request: NextRequest) {
  const username = getUsernameFromRequest(request);
  if (!DISCOGS_USER_TOKEN || !username) {
    return new Response(
      JSON.stringify({ error: "Discogs credentials not set in environment" }),
      { status: 500 }
    );
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        createExportsDir();

        let page = 1;
        const perPage = 100;
        const allIds: string[] = [];
        const newReleases: string[] = [];
        const errors: { releaseId: string; error: string }[] = [];

        // Use a manifest per username
        const manifestIds = getManifestReleaseIds(username);
        console.log(
          `[Discogs Sync] Loaded manifest IDs for ${username}:`,
          manifestIds.length
        );
        controller.enqueue(
          encoder.encode(
            `Loaded manifest IDs for ${username}: ${manifestIds.length}\n\n`
          )
        );

        try {
          // Step 1: Collect all collection release IDs
          while (true) {
            console.log(
              `[Discogs Sync] Fetching collection page ${page} for user ${username}...`
            );
            controller.enqueue(
              encoder.encode(
                `Fetching collection page ${page} for user ${username}:\n\n`
              )
            );
            const collectionPage = await getCollectionPage(
              username,
              page,
              perPage
            );
            const releases = collectionPage.releases || [];
            console.log(
              `[Discogs Sync] Page ${page} - releases found: ${releases.length}`
            );
            controller.enqueue(
              encoder.encode(
                `data:  Page ${page} - releases found: ${releases.length}:\n\n`
              )
            );
            if (releases.length === 0) break;

            for (const release of releases) {
              const releaseId = release.basic_information.id;
              allIds.push(releaseId);
              console.log(`[Discogs Sync] Found release ID: ${releaseId}`);
              controller.enqueue(
                encoder.encode(`Found release ID: ${releaseId}\n\n`)
              );
            }

            if (
              collectionPage.pagination.page < collectionPage.pagination.pages
            ) {
              page += 1;
            } else {
              break;
            }
          }

          // Step 2: Determine new IDs not in manifest
          const newIds = allIds.filter((id) => !manifestIds.includes(id));
          console.log(`[Discogs Sync] New IDs to fetch: ${newIds.length}`);
          controller.enqueue(
            encoder.encode(`New IDs to fetch: ${newIds.length}\n\n`)
          );

          // Step 2.5: Detect removed IDs (in manifest but not in current collection)
          const removedIds = manifestIds.filter((id) => !allIds.includes(id));
          if (removedIds.length > 0) {
            console.log(
              `[Discogs Sync] Removed IDs detected: ${removedIds.length}`
            );
            controller.enqueue(
              encoder.encode(
                `⚠️  Detected ${removedIds.length} releases removed from Discogs collection\n\n`
              )
            );
            // Send as JSON for client to parse
            controller.enqueue(
              encoder.encode(
                `REMOVED_RELEASES:${JSON.stringify({
                  removedIds,
                  username,
                })}\n\n`
              )
            );
          } else {
            controller.enqueue(
              encoder.encode(`No releases removed from collection\n\n`)
            );
          }

          // Step 3: Fetch and save details for new IDs only
          for (const releaseId of newIds) {
            console.log(
              `[Discogs Sync] Fetching details for release ID: ${releaseId}`
            );
            controller.enqueue(
              encoder.encode(
                `Fetching details for release ID: ${releaseId}\n\n`
              )
            );

            try {
              const details = await getReleaseDetails(releaseId);
              const filePath = getReleaseWritePath(username, releaseId);
              fs.writeFileSync(filePath, JSON.stringify(details, null, 2));
              newReleases.push(releaseId);
              controller.enqueue(
                encoder.encode(`Saved release ID: ${releaseId}\n\n`)
              );
              console.log(`[Discogs Sync] Saved release ID: ${releaseId}`);
            } catch (e) {
              const errorMessage = e instanceof Error ? e.message : String(e);
              errors.push({ releaseId, error: errorMessage });
              console.log(
                `[Discogs Sync] Error for release ID ${releaseId}: ${errorMessage}`
              );
              controller.enqueue(
                encoder.encode(
                  `Error for release ID ${releaseId}: ${errorMessage}\n\n`
                )
              );
            }

            // Wait to avoid hitting rate limits
            await new Promise((r) => setTimeout(r, 1200));
          }

          // Step 4: Update and save manifest
          saveManifest(getManifestPath(username), [...manifestIds, ...newIds]);
          console.log(
            `[Discogs Sync] Manifest updated for ${username}. Total IDs: ${
              manifestIds.length + newIds.length
            }`
          );
          controller.enqueue(
            encoder.encode(
              `Manifest updated for ${username}. Total IDs: ${
                manifestIds.length + newIds.length
              }\n\n`
            )
          );

          controller.enqueue(
            encoder.encode(
              `Sync complete for ${username}. New releases downloaded: ${newReleases.length}\n\n`
            )
          );

          // Step 5: Auto-ingest into Postgres and Meilisearch
          if (newReleases.length > 0) {
            controller.enqueue(
              encoder.encode(`\n--- Starting Auto-Ingest ---\n\n`)
            );

            try {
              const { Pool } = await import("pg");
              const { getAllTracksFromManifests } = await import(
                "@/services/discogsManifestService"
              );
              const {
                getOrCreateTracksIndex,
                configureMeiliIndex,
              } = await import("@/services/meiliIndexService");
              const { upsertTracks } = await import(
                "@/services/trackUpsertService"
              );
              const { addTracksToMeili } = await import(
                "@/services/meiliDocumentService"
              );
              const { getMeiliClient } = await import("@/lib/meili");

              const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
              });
              const meiliClient = getMeiliClient();

              controller.enqueue(
                encoder.encode(`Loading tracks from manifests...\n\n`)
              );
              const allTracks = getAllTracksFromManifests();
              controller.enqueue(
                encoder.encode(`Loaded ${allTracks.length} tracks\n\n`)
              );

              controller.enqueue(
                encoder.encode(`Configuring Meilisearch index...\n\n`)
              );
              const index = await getOrCreateTracksIndex(meiliClient);
              await configureMeiliIndex(index, meiliClient);

              controller.enqueue(
                encoder.encode(`Upserting tracks to Postgres...\n\n`)
              );
              const upserted = await upsertTracks(pool, allTracks);
              controller.enqueue(
                encoder.encode(`Upserted ${upserted.length} tracks to Postgres\n\n`)
              );

              controller.enqueue(
                encoder.encode(`Indexing tracks in Meilisearch...\n\n`)
              );
              await addTracksToMeili(index, upserted);
              controller.enqueue(
                encoder.encode(
                  `Indexed ${upserted.length} tracks in Meilisearch\n\n`
                )
              );

              controller.enqueue(
                encoder.encode(`\n✅ Auto-ingest complete!\n\n`)
              );

              await pool.end();
            } catch (e) {
              const errorMessage = e instanceof Error ? e.message : String(e);
              controller.enqueue(
                encoder.encode(`\n❌ Auto-ingest error: ${errorMessage}\n\n`)
              );
              console.error("[Auto-ingest Error]", e);
            }
          } else {
            controller.enqueue(
              encoder.encode(
                `\nNo new releases to ingest. Skipping auto-ingest.\n\n`
              )
            );
          }

          controller.enqueue(
            encoder.encode(`\n🎉 All operations complete!\n\n`)
          );
          controller.close();
        } catch (e) {
          controller.enqueue(
            encoder.encode(
              `Error: ${e instanceof Error ? e.message : String(e)}\n\n`
            )
          );
          controller.close();
        }
      } catch (e) {
        console.log(
          `[Discogs Sync] Error: ${e instanceof Error ? e.message : String(e)}`
        );
        controller.enqueue(
          encoder.encode(
            `Error: ${e instanceof Error ? e.message : String(e)}\n\n`
          )
        );
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
