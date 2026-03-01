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
import { getPostHogClient } from "@/lib/posthog-server";
import { dbPool } from "@/lib/serverDb";
import { cleanupDiscogsReleases } from "@/services/discogsCleanupService";

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
        const dateAddedMap: Map<string, string> = new Map(); // Store date_added from collection

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

        // PostHog: Track Discogs sync started (server-side)
        try {
          const posthog = getPostHogClient();
          posthog.capture({
            distinctId: "server",
            event: "discogs_sync_started",
            properties: {
              username,
              manifest_ids_count: manifestIds.length,
              source: "api",
            },
          });
        } catch (posthogError) {
          console.error("PostHog capture error:", posthogError);
        }

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
              const releaseId = String(release.basic_information.id);
              allIds.push(releaseId);

              // Capture date_added from collection response
              if (release.date_added) {
                dateAddedMap.set(releaseId, release.date_added);
              }

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

          // Step 2.5: Detect and delete removed IDs (in manifest but not in current collection)
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

            // Delete local files first, then clean DB + Meili in one shared service
            try {
              const { deleteRelease } = await import("@/services/discogsManifestService");

              let deletedFiles = 0;
              for (const releaseId of removedIds) {
                if (deleteRelease(username, releaseId)) {
                  deletedFiles += 1;
                }
                if (deletedFiles > 0 && deletedFiles % 10 === 0) {
                  controller.enqueue(
                    encoder.encode(
                      `Deleted local files ${deletedFiles}/${removedIds.length}...\n\n`
                    )
                  );
                }
              }

              const cleanup = await cleanupDiscogsReleases(username, removedIds);
              if (!cleanup.friendId) {
                controller.enqueue(
                  encoder.encode(
                    `⚠️  Could not find friend_id for ${username}, skipped DB/search deletion\n\n`
                  )
                );
              } else {
                controller.enqueue(
                  encoder.encode(
                    `✅ Deleted ${cleanup.deletedTracksCount} tracks and ${cleanup.deletedAlbumsCount} albums for removed releases\n\n`
                  )
                );
              }
            } catch (deleteError) {
              const errorMessage = deleteError instanceof Error ? deleteError.message : String(deleteError);
              controller.enqueue(
                encoder.encode(`⚠️  Error deleting releases: ${errorMessage}\n\n`)
              );
              console.error("[Discogs Sync] Delete error:", deleteError);
            }
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

              // Merge collection date_added if available
              const collectionDateAdded = dateAddedMap.get(releaseId);
              if (collectionDateAdded) {
                details.date_added = collectionDateAdded;
              }

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

          // Step 4: Update and save manifest (exclude removed IDs, add ONLY successfully downloaded new releases)
          const updatedManifestIds = [
            ...manifestIds.filter(id => !removedIds.includes(id)),
            ...newReleases  // Only add successfully downloaded releases, not all newIds
          ];
          saveManifest(getManifestPath(username), updatedManifestIds);
          console.log(
            `[Discogs Sync] Manifest updated for ${username}. Total IDs: ${updatedManifestIds.length} (removed: ${removedIds.length}, added: ${newReleases.length})`
          );
          controller.enqueue(
            encoder.encode(
              `Manifest updated for ${username}. Total IDs: ${updatedManifestIds.length} (added: ${newReleases.length}, failed: ${errors.length})\n\n`
            )
          );

          // Report failed downloads
          if (errors.length > 0) {
            controller.enqueue(
              encoder.encode(
                `\n⚠️  ${errors.length} releases failed to download and were NOT added to manifest:\n`
              )
            );
            for (const error of errors) {
              controller.enqueue(
                encoder.encode(`  - Release ${error.releaseId}: ${error.error}\n`)
              );
            }
            controller.enqueue(encoder.encode('\n'));
          }

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
              const { getTracksFromManifestReleases } = await import(
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

              const meiliClient = getMeiliClient();

              controller.enqueue(
                encoder.encode(`Loading tracks from new releases...\n\n`)
              );
              const allTracks = getTracksFromManifestReleases(
                username,
                newReleases
              );
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
              const upserted = await upsertTracks(dbPool, allTracks);
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

              // Step 6: Ingest albums
              controller.enqueue(
                encoder.encode(`\n--- Ingesting Albums ---\n\n`)
              );

              try {
                const {
                  getAlbumsFromManifestReleases,
                  upsertAlbums,
                } = await import(
                  "@/services/albumUpsertService"
                );
                const {
                  getOrCreateAlbumsIndex,
                  configureAlbumsIndex,
                  addAlbumsToMeili,
                } = await import("@/services/albumMeiliService");

                controller.enqueue(
                  encoder.encode(`Loading albums from new releases...\n`)
                );
                const allAlbums = await getAlbumsFromManifestReleases(
                  dbPool,
                  username,
                  newReleases
                );
                controller.enqueue(
                  encoder.encode(`Loaded ${allAlbums.length} albums\n\n`)
                );

                controller.enqueue(
                  encoder.encode(`Upserting albums to Postgres...\n`)
                );
                const upsertedAlbums = await upsertAlbums(dbPool, allAlbums, {
                  preserveManualFields: true,
                });
                controller.enqueue(
                  encoder.encode(`Upserted ${upsertedAlbums.length} albums to Postgres\n\n`)
                );

                controller.enqueue(
                  encoder.encode(`Configuring albums index in Meilisearch...\n`)
                );
                const albumsIndex = await getOrCreateAlbumsIndex(meiliClient);
                await configureAlbumsIndex(albumsIndex);

                controller.enqueue(
                  encoder.encode(`Indexing albums in Meilisearch...\n`)
                );
                await addAlbumsToMeili(albumsIndex, upsertedAlbums);
                controller.enqueue(
                  encoder.encode(`Indexed ${upsertedAlbums.length} albums in Meilisearch\n\n`)
                );

                controller.enqueue(
                  encoder.encode(`✅ Album ingest complete!\n\n`)
                );
              } catch (albumError) {
                const errorMessage = albumError instanceof Error ? albumError.message : String(albumError);
                controller.enqueue(
                  encoder.encode(`⚠️  Album ingest error: ${errorMessage}\n\n`)
                );
                console.error("[Album Ingest Error]", albumError);
                // Continue even if album ingest fails
              }

              controller.enqueue(
                encoder.encode(`\n✅ Auto-ingest complete!\n\n`)
              );
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
