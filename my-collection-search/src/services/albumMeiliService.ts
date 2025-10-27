import { MeiliSearch, Index } from "meilisearch";
import { Album } from "@/types/track";

/**
 * Get or create albums index in MeiliSearch
 */
export async function getOrCreateAlbumsIndex(
  meiliClient: MeiliSearch
): Promise<Index> {
  try {
    return await meiliClient.getIndex("albums");
  } catch {
    await meiliClient.createIndex("albums", { primaryKey: "id" });
    return meiliClient.index("albums");
  }
}

/**
 * Configure MeiliSearch index settings for albums
 */
export async function configureAlbumsIndex(index: Index) {
  // Searchable attributes (what users can search by)
  await index.updateSearchableAttributes([
    "title",
    "artist",
    "label",
    "catalog_number",
    "genres",
    "styles",
    "album_notes",
  ]);

  // Filterable attributes (for filtering results)
  await index.updateFilterableAttributes([
    "friend_id",
    "release_id",
    "year",
    "genres",
    "styles",
    "album_rating",
    "condition",
    "date_added",
    "label",
    "format",
  ]);

  // Sortable attributes (for sorting results)
  await index.updateSortableAttributes([
    "date_added",
    "year",
    "title",
    "album_rating",
  ]);

  // Ranking rules
  await index.updateRankingRules([
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness",
  ]);
}

/**
 * Add albums to MeiliSearch index
 * Converts Album[] to documents with proper id format for MeiliSearch
 */
export async function addAlbumsToMeili(
  index: Index,
  albums: Album[]
): Promise<void> {
  if (albums.length === 0) return;

  // Convert albums to MeiliSearch documents
  // MeiliSearch requires a unique 'id' field, so we combine release_id and friend_id
  const documents = albums.map((album) => ({
    id: `${album.release_id}_${album.friend_id}`,
    ...album,
  }));

  await index.addDocuments(documents);
}

/**
 * Update a single album in MeiliSearch
 */
export async function updateAlbumInMeili(
  index: Index,
  album: Album
): Promise<void> {
  const document = {
    id: `${album.release_id}_${album.friend_id}`,
    ...album,
  };

  await index.updateDocuments([document]);
}

/**
 * Delete albums from MeiliSearch by release_id and friend_id
 */
export async function deleteAlbumsFromMeili(
  index: Index,
  albumIds: Array<{ release_id: string; friend_id: number }>
): Promise<void> {
  if (albumIds.length === 0) return;

  const documentIds = albumIds.map(
    (album) => `${album.release_id}_${album.friend_id}`
  );

  await index.deleteDocuments(documentIds);
}
