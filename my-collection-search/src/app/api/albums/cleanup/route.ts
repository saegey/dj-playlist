// API endpoint to clean up albums with no tracks
// Deletes albums where track_count = 0 or where no actual tracks exist in the database

import { getMeiliClient } from "@/lib/meili";
import { NextResponse } from "next/server";
import { withDbTransaction } from "@/lib/serverDb";
import { albumRepository, type AlbumCleanupRow } from "@/server/repositories/albumRepository";

function buildAlbumsToDelete(
  emptyCountAlbums: AlbumCleanupRow[],
  orphanedAlbums: AlbumCleanupRow[]
): Map<string, AlbumCleanupRow> {
  const albumsToDelete = new Map<string, AlbumCleanupRow>();
  for (const album of emptyCountAlbums) {
    albumsToDelete.set(`${album.release_id}_${album.friend_id}`, album);
  }
  for (const album of orphanedAlbums) {
    albumsToDelete.set(`${album.release_id}_${album.friend_id}`, album);
  }
  return albumsToDelete;
}

export async function POST() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode("Starting album cleanup process...\n\n")
        );

        controller.enqueue(
          encoder.encode("Finding albums with track_count = 0...\n")
        );
        const emptyCountAlbums = await albumRepository.listAlbumsWithTrackCountZero();
        controller.enqueue(
          encoder.encode(
            `Found ${emptyCountAlbums.length} albums with track_count = 0\n\n`
          )
        );

        controller.enqueue(
          encoder.encode(
            "Finding albums with no corresponding tracks in database...\n"
          )
        );
        const orphanedAlbums = await albumRepository.listOrphanedAlbums();
        controller.enqueue(
          encoder.encode(
            `Found ${orphanedAlbums.length} albums with no tracks in database\n\n`
          )
        );

        const albumsToDelete = buildAlbumsToDelete(
          emptyCountAlbums,
          orphanedAlbums
        );

        controller.enqueue(
          encoder.encode(
            `Total unique albums to delete: ${albumsToDelete.size}\n\n`
          )
        );

        if (albumsToDelete.size === 0) {
          controller.enqueue(
            encoder.encode("✅ No albums to clean up. Database is healthy!\n")
          );
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode("Deleting albums from database...\n")
        );
        let deletedCount = 0;
        try {
          await withDbTransaction(async (client) => {
            for (const [, album] of albumsToDelete) {
              await albumRepository.deleteAlbumByReleaseAndFriend(
                client,
                album.release_id,
                album.friend_id
              );
              deletedCount++;
              if (deletedCount % 10 === 0) {
                controller.enqueue(
                  encoder.encode(
                    `Deleted ${deletedCount}/${albumsToDelete.size} albums...\n`
                  )
                );
              }
            }
          });
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `❌ Error deleting albums: ${
                error instanceof Error ? error.message : String(error)
              }\n`
            )
          );
        }

        controller.enqueue(
          encoder.encode(`\n✅ Deleted ${deletedCount} albums from database\n\n`)
        );

        controller.enqueue(
          encoder.encode("Cleaning up MeiliSearch index...\n")
        );
        try {
          const meiliClient = getMeiliClient();
          const albumsIndex = meiliClient.index("albums");
          const docIds = Array.from(albumsToDelete.keys());
          let meiliDeletedCount = 0;

          for (const docId of docIds) {
            try {
              await albumsIndex.deleteDocument(docId);
              meiliDeletedCount++;
              if (meiliDeletedCount % 10 === 0) {
                controller.enqueue(
                  encoder.encode(
                    `Deleted ${meiliDeletedCount}/${docIds.length} from MeiliSearch...\n`
                  )
                );
              }
            } catch (error) {
              if (error instanceof Error && !error.message.includes("not found")) {
                controller.enqueue(
                  encoder.encode(
                    `⚠️  MeiliSearch delete warning for ${docId}: ${error.message}\n`
                  )
                );
              }
            }
          }

          controller.enqueue(
            encoder.encode(
              `✅ Deleted ${meiliDeletedCount} documents from MeiliSearch\n\n`
            )
          );
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `⚠️  MeiliSearch cleanup error: ${
                error instanceof Error ? error.message : String(error)
              }\n`
            )
          );
        }

        controller.enqueue(encoder.encode("\n📊 Cleanup Summary:\n"));
        controller.enqueue(
          encoder.encode(`  • Albums deleted from database: ${deletedCount}\n`)
        );
        controller.enqueue(
          encoder.encode(
            `  • Albums had track_count = 0: ${emptyCountAlbums.length}\n`
          )
        );
        controller.enqueue(
          encoder.encode(
            `  • Albums had no tracks in DB: ${orphanedAlbums.length}\n\n`
          )
        );

        controller.enqueue(
          encoder.encode("\n📝 Sample of deleted albums:\n")
        );
        const sample = Array.from(albumsToDelete.values()).slice(0, 10);
        for (const album of sample) {
          controller.enqueue(
            encoder.encode(
              `  • ${album.artist} - ${album.title} (${album.release_id})\n`
            )
          );
        }
        if (albumsToDelete.size > 10) {
          controller.enqueue(
            encoder.encode(`  ... and ${albumsToDelete.size - 10} more\n`)
          );
        }

        controller.enqueue(
          encoder.encode("\n🎉 Album cleanup process complete!\n")
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

// Also provide a GET endpoint that returns JSON summary without deleting
export async function GET() {
  try {
    const emptyCountRows = await albumRepository.listAlbumsWithTrackCountZero();
    const orphanedRows = await albumRepository.listOrphanedAlbums();
    const albumsToClean = buildAlbumsToDelete(emptyCountRows, orphanedRows);

    return NextResponse.json({
      totalAlbumsToClean: albumsToClean.size,
      emptyTrackCount: emptyCountRows.length,
      orphanedAlbums: orphanedRows.length,
      sample: Array.from(albumsToClean.values()).slice(0, 20),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
