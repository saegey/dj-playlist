// API endpoint to clean up albums with no tracks
// Deletes albums where track_count = 0 or where no actual tracks exist in the database

import { Pool } from "pg";
import { getMeiliClient } from "@/lib/meili";
import { NextResponse } from "next/server";

export async function POST() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      try {
        controller.enqueue(
          encoder.encode("Starting album cleanup process...\n\n")
        );

        // Find albums with track_count = 0
        controller.enqueue(
          encoder.encode("Finding albums with track_count = 0...\n")
        );
        const emptyCountResult = await pool.query(`
          SELECT release_id, friend_id, title, artist
          FROM albums
          WHERE track_count = 0
        `);
        const emptyCountAlbums = emptyCountResult.rows;
        controller.enqueue(
          encoder.encode(
            `Found ${emptyCountAlbums.length} albums with track_count = 0\n\n`
          )
        );

        // Find albums where no actual tracks exist in the database
        controller.enqueue(
          encoder.encode(
            "Finding albums with no corresponding tracks in database...\n"
          )
        );
        const orphanedResult = await pool.query(`
          SELECT a.release_id, a.friend_id, a.title, a.artist, a.track_count
          FROM albums a
          LEFT JOIN tracks t ON a.release_id = t.release_id AND a.friend_id = t.friend_id
          WHERE t.track_id IS NULL
        `);
        const orphanedAlbums = orphanedResult.rows;
        controller.enqueue(
          encoder.encode(
            `Found ${orphanedAlbums.length} albums with no tracks in database\n\n`
          )
        );

        // Combine both lists (use a Set to avoid duplicates)
        const albumsToDelete = new Map<
          string,
          { release_id: string; friend_id: number; title: string; artist: string }
        >();

        for (const album of emptyCountAlbums) {
          const key = `${album.release_id}_${album.friend_id}`;
          albumsToDelete.set(key, album);
        }

        for (const album of orphanedAlbums) {
          const key = `${album.release_id}_${album.friend_id}`;
          albumsToDelete.set(key, album);
        }

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
          await pool.end();
          return;
        }

        // Delete from database
        controller.enqueue(
          encoder.encode("Deleting albums from database...\n")
        );
        let deletedCount = 0;

        for (const [, album] of albumsToDelete) {
          try {
            await pool.query(
              "DELETE FROM albums WHERE release_id = $1 AND friend_id = $2",
              [album.release_id, album.friend_id]
            );
            deletedCount++;

            if (deletedCount % 10 === 0) {
              controller.enqueue(
                encoder.encode(
                  `Deleted ${deletedCount}/${albumsToDelete.size} albums...\n`
                )
              );
            }
          } catch (error) {
            controller.enqueue(
              encoder.encode(
                `❌ Error deleting album ${album.release_id} (${album.title}): ${
                  error instanceof Error ? error.message : String(error)
                }\n`
              )
            );
          }
        }

        controller.enqueue(
          encoder.encode(`\n✅ Deleted ${deletedCount} albums from database\n\n`)
        );

        // Delete from MeiliSearch
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
              // Ignore errors for documents that don't exist in MeiliSearch
              if (
                error instanceof Error &&
                !error.message.includes("not found")
              ) {
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

        // Summary
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

        // Show sample of deleted albums
        if (albumsToDelete.size > 0) {
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
              encoder.encode(
                `  ... and ${albumsToDelete.size - 10} more\n`
              )
            );
          }
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
      } finally {
        await pool.end();
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
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Find albums with track_count = 0
    const emptyCountResult = await pool.query(`
      SELECT release_id, friend_id, title, artist, track_count
      FROM albums
      WHERE track_count = 0
    `);

    // Find albums where no actual tracks exist
    const orphanedResult = await pool.query(`
      SELECT a.release_id, a.friend_id, a.title, a.artist, a.track_count
      FROM albums a
      LEFT JOIN tracks t ON a.release_id = t.release_id AND a.friend_id = t.friend_id
      WHERE t.track_id IS NULL
    `);

    // Combine and deduplicate
    const albumsToClean = new Map<
      string,
      { release_id: string; friend_id: number; title: string; artist: string; track_count: number }
    >();

    for (const album of emptyCountResult.rows) {
      const key = `${album.release_id}_${album.friend_id}`;
      albumsToClean.set(key, album);
    }

    for (const album of orphanedResult.rows) {
      const key = `${album.release_id}_${album.friend_id}`;
      albumsToClean.set(key, album);
    }

    return NextResponse.json({
      totalAlbumsToClean: albumsToClean.size,
      emptyTrackCount: emptyCountResult.rows.length,
      orphanedAlbums: orphanedResult.rows.length,
      sample: Array.from(albumsToClean.values()).slice(0, 20),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
