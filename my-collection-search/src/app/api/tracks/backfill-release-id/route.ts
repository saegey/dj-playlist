// API endpoint to backfill release_id for tracks where it's NULL
// Extracts release_id from track_id format: {releaseId}-{position}

import { Pool } from "pg";
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
          encoder.encode("Starting release_id backfill process...\n\n")
        );

        // Find all tracks with NULL release_id
        const nullReleaseIdResult = await pool.query(`
          SELECT track_id, username, friend_id
          FROM tracks
          WHERE release_id IS NULL
        `);

        const tracksToFix = nullReleaseIdResult.rows;
        controller.enqueue(
          encoder.encode(
            `Found ${tracksToFix.length} tracks with NULL release_id\n\n`
          )
        );

        if (tracksToFix.length === 0) {
          controller.enqueue(
            encoder.encode("✅ No tracks to fix. All tracks have release_id!\n")
          );
          controller.close();
          await pool.end();
          return;
        }

        let updatedCount = 0;
        let errorCount = 0;

        for (const track of tracksToFix) {
          try {
            // Extract release_id from track_id (format: {releaseId}-{position})
            // The track_id is sanitized, but we can split on the last dash to get the release_id
            const parts = track.track_id.split("-");

            // The release_id is everything except the last part (position)
            if (parts.length < 2) {
              controller.enqueue(
                encoder.encode(
                  `⚠️  Cannot parse track_id: ${track.track_id}\n`
                )
              );
              errorCount++;
              continue;
            }

            // Remove the last part (position) and join the rest back
            const releaseId = parts.slice(0, -1).join("-");

            // Update the track with the extracted release_id
            await pool.query(
              `UPDATE tracks
               SET release_id = $1
               WHERE track_id = $2 AND username = $3`,
              [releaseId, track.track_id, track.username]
            );

            updatedCount++;

            if (updatedCount % 50 === 0) {
              controller.enqueue(
                encoder.encode(
                  `Updated ${updatedCount}/${tracksToFix.length} tracks...\n`
                )
              );
            }
          } catch (error) {
            errorCount++;
            controller.enqueue(
              encoder.encode(
                `❌ Error updating track ${track.track_id}: ${
                  error instanceof Error ? error.message : String(error)
                }\n`
              )
            );
          }
        }

        controller.enqueue(
          encoder.encode(
            `\n✅ Backfill complete! Updated ${updatedCount} tracks\n`
          )
        );

        if (errorCount > 0) {
          controller.enqueue(
            encoder.encode(`⚠️  ${errorCount} errors occurred\n`)
          );
        }

        // Now verify the orphaned albums are fixed
        controller.enqueue(
          encoder.encode("\n🔍 Checking for remaining orphaned albums...\n")
        );

        const stillOrphanedResult = await pool.query(`
          SELECT COUNT(*) as count
          FROM albums a
          LEFT JOIN tracks t ON a.release_id = t.release_id AND a.friend_id = t.friend_id
          WHERE t.track_id IS NULL AND a.track_count > 0
        `);

        const stillOrphaned = parseInt(stillOrphanedResult.rows[0].count);

        if (stillOrphaned > 0) {
          controller.enqueue(
            encoder.encode(
              `⚠️  Still ${stillOrphaned} orphaned albums with track_count > 0\n`
            )
          );
        } else {
          controller.enqueue(
            encoder.encode("✅ No more orphaned albums!\n")
          );
        }

        controller.enqueue(
          encoder.encode("\n🎉 Release ID backfill process complete!\n")
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

// GET endpoint to preview what would be fixed
export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const nullReleaseIdResult = await pool.query(`
      SELECT track_id, username, friend_id, title, artist
      FROM tracks
      WHERE release_id IS NULL
      LIMIT 20
    `);

    const countResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM tracks
      WHERE release_id IS NULL
    `);

    return NextResponse.json({
      totalToFix: parseInt(countResult.rows[0].count),
      sample: nullReleaseIdResult.rows.map((row) => {
        const parts = row.track_id.split("-");
        const releaseId = parts.slice(0, -1).join("-");
        return {
          ...row,
          extractedReleaseId: releaseId,
        };
      }),
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
