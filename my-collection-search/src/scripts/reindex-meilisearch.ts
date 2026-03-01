#!/usr/bin/env node

import { getMeiliClient } from "@/lib/meili";
import {
  configureAlbumsIndex,
  getOrCreateAlbumsIndex,
} from "@/server/services/albumMeiliService";
import { albumRepository } from "@/server/repositories/albumRepository";
import { addTracksToMeili } from "@/server/services/meiliDocumentService";
import {
  configureMeiliIndex,
  getOrCreateTracksIndex,
} from "@/server/services/meiliIndexService";
import { trackRepository } from "@/server/repositories/trackRepository";

async function reindexMeiliSearch() {
  const meiliClient = getMeiliClient();

  try {
    console.log("Starting MeiliSearch re-indexing...\n");

    console.log("Fetching tracks from database...");
    const tracks = await trackRepository.listTracksForReindex();
    console.log(`Found ${tracks.length} tracks in database\n`);

    if (tracks.length === 0) {
      console.log("⚠️  No tracks found in database. Skipping track re-index.");
    } else {
      console.log("Setting up tracks index...");
      const tracksIndex = await getOrCreateTracksIndex(meiliClient);
      await configureMeiliIndex(tracksIndex, meiliClient);

      await tracksIndex.deleteAllDocuments();
      await addTracksToMeili(tracksIndex, tracks);

      const trackStats = await tracksIndex.getStats();
      console.log(`📈 Tracks in index: ${trackStats.numberOfDocuments}`);
    }

    console.log("\nFetching albums from database...");
    const albumRows = await albumRepository.listAlbumsForReindex();
    const albums = albumRows.map((row) => ({
      id: `${row.release_id}_${row.friend_id}`,
      ...row,
    }));
    console.log(`Found ${albums.length} albums in database\n`);

    if (albums.length === 0) {
      console.log("⚠️  No albums found in database. Skipping album re-index.");
    } else {
      console.log("Setting up albums index...");
      const albumsIndex = await getOrCreateAlbumsIndex(meiliClient);
      await configureAlbumsIndex(albumsIndex);

      await albumsIndex.deleteAllDocuments();
      await albumsIndex.addDocuments(albums);

      const albumStats = await albumsIndex.getStats();
      console.log(`📈 Albums in index: ${albumStats.numberOfDocuments}`);
    }

    console.log("\n✅ Re-indexing complete!");
    console.log(`   - Tracks indexed: ${tracks.length}`);
    console.log(`   - Albums indexed: ${albums.length}`);
  } catch (error) {
    console.error("❌ Error during re-indexing:", error);
    process.exit(1);
  }
}

reindexMeiliSearch();
