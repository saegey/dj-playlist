// API endpoint to backfill albums table from existing Discogs release files
// This reads all release JSONs and creates album records in PostgreSQL

import { dbPool } from "@/lib/serverDb";
import {
  getManifestFiles,
  parseManifestFile,
  getReleasePath,
  loadAlbum,
} from "@/server/services/discogsManifestService";
import { albumRepository } from "@/server/repositories/albumRepository";
import { upsertAlbum } from "@/server/services/albumUpsertService";

export async function POST() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode("Starting album backfill process...\n\n")
        );

        const manifestFiles = getManifestFiles();
        controller.enqueue(
          encoder.encode(`Found ${manifestFiles.length} manifest files\n\n`)
        );

        let totalAlbums = 0;
        const errors: string[] = [];

        for (const manifestFile of manifestFiles) {
          const { manifest, username } = parseManifestFile(manifestFile);
          controller.enqueue(
            encoder.encode(`\nProcessing manifest for user: ${username}\n`)
          );

          // Get or create friend_id
          const friendId = await albumRepository.ensureFriendIdByUsername(username);
          controller.enqueue(
            encoder.encode(`Friend ID for ${username}: ${friendId}\n`)
          );

          const releaseIds: string[] = (manifest.releaseIds || []).map((id: unknown) => String(id));
          controller.enqueue(
            encoder.encode(`Found ${releaseIds.length} releases\n\n`)
          );

          for (const releaseId of releaseIds) {
            try {
              const releasePath = getReleasePath(username, releaseId);
              if (!releasePath) {
                controller.enqueue(
                  encoder.encode(`⚠️  Release file not found: ${releaseId}\n`)
                );
                continue;
              }

              const album = loadAlbum(releasePath);
              if (!album) {
                controller.enqueue(
                  encoder.encode(`⚠️  Could not load album: ${releaseId}\n`)
                );
                continue;
              }

              // Extract album data
              const albumRecord = {
                release_id: releaseId,
                friend_id: friendId,
                title: album.title,
                artist:
                  album.artists_sort ||
                  album.artists?.[0]?.name ||
                  "Unknown Artist",
                year: album.year?.toString(),
                genres: album.genres || [],
                styles: album.styles || [],
                album_thumbnail: album.thumb,
                discogs_url: album.uri,
                date_added: album.date_added,
                date_changed: album.date_changed,
                track_count: album.tracklist?.length || 0,
                label: album.labels?.[0]?.name ?? undefined,
                catalog_number: album.labels?.[0]?.catno,
                country: album.country,
                format: Array.isArray(album.formats)
                  ? album.formats?.[0]?.name ?? undefined
                  : undefined,
              };

              // Upsert album to database
              await upsertAlbum(dbPool, albumRecord);

              totalAlbums++;
              if (totalAlbums % 10 === 0) {
                controller.enqueue(
                  encoder.encode(`Processed ${totalAlbums} albums...\n`)
                );
              }
            } catch (error) {
              const errorMsg = `Error processing release ${releaseId}: ${
                error instanceof Error ? error.message : String(error)
              }`;
              errors.push(errorMsg);
              controller.enqueue(encoder.encode(`❌ ${errorMsg}\n`));
            }
          }
        }

        controller.enqueue(
          encoder.encode(
            `\n✅ Backfill complete! Total albums: ${totalAlbums}\n`
          )
        );

        if (errors.length > 0) {
          controller.enqueue(
            encoder.encode(`\n⚠️  ${errors.length} errors occurred:\n`)
          );
          errors.slice(0, 10).forEach((err) => {
            controller.enqueue(encoder.encode(`  - ${err}\n`));
          });
        }

        controller.enqueue(
          encoder.encode("\n🎉 Album backfill process complete!\n")
        );
        controller.close();
      } catch (error) {
        const errorMsg = `Fatal error: ${
          error instanceof Error ? error.message : String(error)
        }`;
        controller.enqueue(encoder.encode(`❌ ${errorMsg}\n`));
        controller.close();
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
