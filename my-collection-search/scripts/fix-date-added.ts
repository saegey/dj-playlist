/**
 * One-time migration script to fix date_added in existing Discogs export files.
 *
 * This script:
 * 1. Fetches collection data from Discogs API to get correct date_added
 * 2. Updates existing release JSON files with the correct date_added
 * 3. Optionally re-backfills albums table
 *
 * Usage:
 *   npx tsx scripts/fix-date-added.ts [username]
 */

import fs from "fs";
import { getCollectionPage } from "@/services/discogsApiClient";
import {
  getManifestReleaseIds,
  getReleasePath,
  parseManifestFile,
  getManifestFiles,
} from "@/services/discogsManifestService";

async function fetchAllCollectionDateAdded(
  username: string
): Promise<Map<string, string>> {
  const dateAddedMap = new Map<string, string>();
  let page = 1;
  const perPage = 100;

  console.log(`Fetching collection for ${username}...`);

  while (true) {
    console.log(`  Fetching page ${page}...`);
    const collectionPage = await getCollectionPage(username, page, perPage);
    const releases = collectionPage.releases || [];

    if (releases.length === 0) break;

    for (const release of releases) {
      const releaseId = release.basic_information.id;
      if (release.date_added) {
        dateAddedMap.set(releaseId, release.date_added);
      }
    }

    console.log(`    Found ${releases.length} releases on page ${page}`);

    if (
      collectionPage.pagination.page < collectionPage.pagination.pages
    ) {
      page += 1;
      // Rate limiting
      await new Promise((r) => setTimeout(r, 1200));
    } else {
      break;
    }
  }

  console.log(`Total releases with date_added: ${dateAddedMap.size}`);
  return dateAddedMap;
}

function updateReleaseFile(
  releasePath: string,
  dateAdded: string
): boolean {
  try {
    const content = fs.readFileSync(releasePath, "utf-8");
    const release = JSON.parse(content);

    // Update date_added
    release.date_added = dateAdded;

    // Write back
    fs.writeFileSync(releasePath, JSON.stringify(release, null, 2));
    return true;
  } catch (error) {
    console.error(`Error updating ${releasePath}:`, error);
    return false;
  }
}

async function fixDateAddedForUser(username: string) {
  console.log(`\n=== Processing user: ${username} ===\n`);

  // Fetch collection data from Discogs
  const dateAddedMap = await fetchAllCollectionDateAdded(username);

  // Get manifest release IDs
  const manifestIds = getManifestReleaseIds(username);
  console.log(`\nManifest has ${manifestIds.length} releases`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  // Update each release file
  for (const releaseId of manifestIds) {
    const releasePath = getReleasePath(username, releaseId);

    if (!releasePath) {
      console.log(`  ⚠️  Release file not found for ${releaseId}`);
      notFound++;
      continue;
    }

    const collectionDateAdded = dateAddedMap.get(releaseId);

    if (!collectionDateAdded) {
      console.log(`  ⚠️  No date_added in collection for ${releaseId}`);
      skipped++;
      continue;
    }

    if (updateReleaseFile(releasePath, collectionDateAdded)) {
      updated++;
      if (updated % 10 === 0) {
        console.log(`  Updated ${updated} files...`);
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Complete for ${username}:`);
  console.log(`  - Updated: ${updated}`);
  console.log(`  - Skipped: ${skipped}`);
  console.log(`  - Not found: ${notFound}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Process specific username
    const username = args[0];
    await fixDateAddedForUser(username);
  } else {
    // Process all users from manifests
    const manifestFiles = getManifestFiles();

    if (manifestFiles.length === 0) {
      console.log("No manifest files found in discogs_exports/");
      process.exit(1);
    }

    console.log(`Found ${manifestFiles.length} manifest(s)`);

    for (const manifestFile of manifestFiles) {
      const { username } = parseManifestFile(manifestFile);
      await fixDateAddedForUser(username);

      // Rate limiting between users
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log("\n🎉 All done!");
  console.log("\nNext steps:");
  console.log("  1. Run migrations: npm run migrate");
  console.log("  2. Re-backfill albums: curl http://localhost:3000/api/albums/backfill");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
