import { Pool } from "pg";
import { Album, DiscogsRelease } from "@/types/track";


export interface AlbumToUpsert {
  release_id: string;
  friend_id: number;
  title: string;
  artist: string;
  year?: string;
  genres?: string[];
  styles?: string[];
  album_thumbnail?: string;
  discogs_url?: string;
  date_added?: string;
  date_changed?: string;
  track_count: number;
  label?: string;
  catalog_number?: string;
  country?: string;
  format?: string;
  album_notes?: string;
  album_rating?: number;
  purchase_price?: number;
  condition?: string;
  library_identifier?: string;
}

/**
 * Get or create friend_id for a username
 */
async function getFriendId(pool: Pool, username: string): Promise<number> {
  const result = await pool.query(
    "SELECT id FROM friends WHERE username = $1",
    [username]
  );
  if (result.rows.length === 0) {
    const insertResult = await pool.query(
      "INSERT INTO friends (username) VALUES ($1) RETURNING id",
      [username]
    );
    return insertResult.rows[0].id;
  }
  return result.rows[0].id;
}

/**
 * Convert a Discogs release to an AlbumToUpsert object
 */
export function discogsReleaseToAlbum(
  release: DiscogsRelease,
  friendId: number
): AlbumToUpsert {
  const artist = release.artists_sort || release.artists?.[0]?.name || "Unknown Artist";

  return {
    release_id: String(release.id),
    friend_id: friendId,
    title: release.title,
    artist,
    year: release.year?.toString(),
    genres: release.genres || [],
    styles: release.styles || [],
    album_thumbnail: release.thumb,
    discogs_url: release.uri,
    date_added: release.date_added,
    date_changed: release.date_changed,
    track_count: release.tracklist?.length || 0,
    label: release.labels?.[0]?.name ?? undefined,
    catalog_number: release.labels?.[0]?.catno,
    country: release.country,
    format: Array.isArray(release.formats)
      ? release.formats?.[0]?.name ?? undefined
      : undefined,
  };
}

/**
 * Upsert a single album to PostgreSQL
 */
export async function upsertAlbum(
  pool: Pool,
  album: AlbumToUpsert,
  options?: { preserveManualFields?: boolean }
): Promise<Album> {
  const preserveManualFields = options?.preserveManualFields ?? false;
  const manualUpdateSql = preserveManualFields
    ? `
      album_notes = albums.album_notes,
      album_rating = albums.album_rating,
      purchase_price = albums.purchase_price,
      condition = albums.condition,
      library_identifier = albums.library_identifier,
    `
    : `
      album_notes = COALESCE(EXCLUDED.album_notes, albums.album_notes),
      album_rating = COALESCE(EXCLUDED.album_rating, albums.album_rating),
      purchase_price = COALESCE(EXCLUDED.purchase_price, albums.purchase_price),
      condition = COALESCE(EXCLUDED.condition, albums.condition),
      library_identifier = COALESCE(EXCLUDED.library_identifier, albums.library_identifier),
    `;

  const result = await pool.query(
    `
    INSERT INTO albums (
      release_id, friend_id, title, artist, year, genres, styles,
      album_thumbnail, discogs_url, date_added, date_changed,
      track_count, label, catalog_number, country, format,
      album_notes, album_rating, purchase_price, condition, library_identifier
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
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
      ${manualUpdateSql}
      updated_at = current_timestamp
    RETURNING *
    `,
    [
      album.release_id,
      album.friend_id,
      album.title,
      album.artist,
      album.year,
      album.genres,
      album.styles,
      album.album_thumbnail,
      album.discogs_url,
      album.date_added,
      album.date_changed,
      album.track_count,
      album.label,
      album.catalog_number,
      album.country,
      album.format,
      album.album_notes ?? null,
      album.album_rating ?? null,
      album.purchase_price ?? null,
      album.condition ?? null,
      album.library_identifier ?? null,
    ]
  );

  return result.rows[0];
}

/**
 * Upsert multiple albums to PostgreSQL
 */
export async function upsertAlbums(
  pool: Pool,
  albums: AlbumToUpsert[],
  options?: { preserveManualFields?: boolean }
): Promise<Album[]> {
  const upsertedAlbums: Album[] = [];

  for (const album of albums) {
    try {
      const upserted = await upsertAlbum(pool, album, options);
      upsertedAlbums.push(upserted);
    } catch (error) {
      console.error(
        `Error upserting album ${album.release_id}:`,
        error instanceof Error ? error.message : error
      );
      // Continue with other albums
    }
  }

  return upsertedAlbums;
}

/**
 * Get all albums from manifest files and convert to AlbumToUpsert format
 */
export async function getAllAlbumsFromManifests(
  pool: Pool
): Promise<AlbumToUpsert[]> {
  const {
    getManifestFiles,
    parseManifestFile,
    getReleasePath,
    loadAlbum,
  } = await import("@/services/discogsManifestService");

  const manifestFiles = getManifestFiles();
  const albums: AlbumToUpsert[] = [];

  for (const manifestFile of manifestFiles) {
    const { manifest, username } = parseManifestFile(manifestFile);
    const friendId = await getFriendId(pool, username);
    const releaseIds: string[] = manifest.releaseIds || [];

    for (const releaseId of releaseIds) {
      const releasePath = getReleasePath(username, releaseId);
      if (!releasePath) continue;

      const release = loadAlbum(releasePath);
      if (!release) continue;

      const album = discogsReleaseToAlbum(release, friendId);
      albums.push(album);
    }
  }

  return albums;
}

export async function getAlbumsFromManifestReleases(
  pool: Pool,
  username: string,
  releaseIds: string[]
): Promise<AlbumToUpsert[]> {
  const { getReleasePath, loadAlbum } = await import(
    "@/services/discogsManifestService"
  );
  const friendId = await getFriendId(pool, username);
  const albums: AlbumToUpsert[] = [];

  for (const releaseId of releaseIds) {
    const releasePath = getReleasePath(username, String(releaseId));
    if (!releasePath) continue;
    const release = loadAlbum(releasePath);
    if (!release) continue;
    albums.push(discogsReleaseToAlbum(release, friendId));
  }

  return albums;
}
