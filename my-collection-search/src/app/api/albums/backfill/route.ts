// API endpoint to backfill albums table from existing Discogs release files
// This reads all release JSONs, creates album records, and indexes them in MeiliSearch

import { Pool } from "pg";
import { getMeiliClient } from "@/lib/meili";
import {
  getManifestFiles,
  parseManifestFile,
  getReleasePath,
  loadAlbum,
} from "@/services/discogsManifestService";

async function getFriendId(pool: Pool, username: string): Promise<number> {
  const result = await pool.query(
    "SELECT id FROM friends WHERE username = $1",
    [username]
  );
  if (result.rows.length === 0) {
    // Create friend if doesn't exist
    const insertResult = await pool.query(
      "INSERT INTO friends (username) VALUES ($1) RETURNING id",
      [username]
    );
    return insertResult.rows[0].id;
  }
  return result.rows[0].id;
}

export async function POST() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      try {
        controller.enqueue(
          encoder.encode("Starting album backfill process...\n\n")
        );

        const manifestFiles = getManifestFiles();
        controller.enqueue(
          encoder.encode(`Found ${manifestFiles.length} manifest files\n\n`)
        );

        let totalAlbums = 0;
        let totalIndexed = 0;
        const errors: string[] = [];

        for (const manifestFile of manifestFiles) {
          const { manifest, username } = parseManifestFile(manifestFile);
          controller.enqueue(
            encoder.encode(`\nProcessing manifest for user: ${username}\n`)
          );

          // Get or create friend_id
          const friendId = await getFriendId(pool, username);
          controller.enqueue(
            encoder.encode(`Friend ID for ${username}: ${friendId}\n`)
          );

          const releaseIds: string[] = manifest.releaseIds || [];
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
                label: album.labels ? album.labels[0]?.name : [],
                catalog_number: album.labels?.[0]?.catno,
                country: album.country,
                format: Array.isArray(album.formats)
                  ? album.formats?.[0]?.name
                  : [],
              };

              // Upsert album to database
              await pool.query(
                `
                INSERT INTO albums (
                  release_id, friend_id, title, artist, year, genres, styles,
                  album_thumbnail, discogs_url, date_added, date_changed,
                  track_count, label, catalog_number, country, format
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                ON CONFLICT (release_id, friend_id)
                DO UPDATE SET
                  title = EXCLUDED.title,
                  artist = EXCLUDED.artist,
                  year = EXCLUDED.year,
                  genres = EXCLUDED.genres,
                  styles = EXCLUDED.styles,
                  album_thumbnail = EXCLUDED.album_thumbnail,
                  discogs_url = EXCLUDED.discogs_url,
                  date_added = EXCLUDED.date_added,
                  date_changed = EXCLUDED.date_changed,
                  track_count = EXCLUDED.track_count,
                  label = EXCLUDED.label,
                  catalog_number = EXCLUDED.catalog_number,
                  country = EXCLUDED.country,
                  format = EXCLUDED.format,
                  updated_at = current_timestamp
                `,
                [
                  albumRecord.release_id,
                  albumRecord.friend_id,
                  albumRecord.title,
                  albumRecord.artist,
                  albumRecord.year,
                  albumRecord.genres,
                  albumRecord.styles,
                  albumRecord.album_thumbnail,
                  albumRecord.discogs_url,
                  albumRecord.date_added,
                  albumRecord.date_changed,
                  albumRecord.track_count,
                  albumRecord.label,
                  albumRecord.catalog_number,
                  albumRecord.country,
                  albumRecord.format,
                ]
              );

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

        // Now index in MeiliSearch
        controller.enqueue(
          encoder.encode("\nIndexing albums in MeiliSearch...\n")
        );

        try {
          const meiliClient = getMeiliClient();

          // Get all albums from database
          const result = await pool.query(`
            SELECT
              release_id,
              friend_id,
              title,
              artist,
              year,
              genres,
              styles,
              album_thumbnail,
              discogs_url,
              date_added,
              date_changed,
              track_count,
              album_rating,
              album_notes,
              purchase_price,
              condition,
              label,
              catalog_number,
              country,
              format
            FROM albums
          `);

          const albums = result.rows.map((row) => ({
            id: `${row.release_id}_${row.friend_id}`, // MeiliSearch primary key
            ...row,
          }));

          // Create or get albums index
          let index;
          try {
            index = await meiliClient.getIndex("albums");
          } catch {
            await meiliClient.createIndex("albums", { primaryKey: "id" });
            index = meiliClient.index("albums");
          }

          // Configure index
          await index.updateSearchableAttributes([
            "title",
            "artist",
            "label",
            "catalog_number",
            "genres",
            "styles",
          ]);

          await index.updateFilterableAttributes([
            "friend_id",
            "release_id",
            "year",
            "genres",
            "styles",
            "album_rating",
            "condition",
            "date_added",
          ]);

          await index.updateSortableAttributes(["date_added", "year", "title"]);

          // Add albums to index
          await index.addDocuments(albums);
          totalIndexed = albums.length;

          controller.enqueue(
            encoder.encode(`✅ Indexed ${totalIndexed} albums in MeiliSearch\n`)
          );
        } catch (error) {
          const errorMsg = `Error indexing in MeiliSearch: ${
            error instanceof Error ? error.message : String(error)
          }`;
          errors.push(errorMsg);
          controller.enqueue(encoder.encode(`❌ ${errorMsg}\n`));
        }

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
