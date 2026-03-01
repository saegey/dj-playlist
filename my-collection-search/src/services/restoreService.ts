import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { dbQuery } from "@/lib/serverDb";
import { getMeiliClient } from "@/lib/meili";
import {
  getOrCreateAlbumsIndex,
  configureAlbumsIndex,
} from "@/services/albumMeiliService";
import {
  getOrCreateTracksIndex,
  configureMeiliIndex,
} from "@/services/meiliIndexService";
import { addTracksToMeili } from "@/services/meiliDocumentService";
import type { Track } from "@/types/track";

type RestorePgConfig = {
  db: string;
  user: string;
  pass: string;
  host: string;
  port: string;
};

type RestoreResult = {
  message: string;
  backupType: "schema+data" | "data-only";
  fileType: "sql" | "dump";
  reindex: {
    albumsIndexed: number;
    tracksIndexed: number;
    warning: string | null;
  };
};

function parsePgUrl(pgUrl: string) {
  try {
    const url = new URL(pgUrl);
    return {
      user: url.username,
      pass: url.password,
      host: url.hostname,
      port: url.port || "5432",
      db: url.pathname.replace(/^\//, ""),
    };
  } catch {
    return {};
  }
}

function getPgConfig(): RestorePgConfig {
  const fromUrl = process.env.DATABASE_URL
    ? parsePgUrl(process.env.DATABASE_URL)
    : {};
  return {
    db: String(fromUrl.db || process.env.POSTGRES_DB || "mydb"),
    user: String(fromUrl.user || process.env.POSTGRES_USER || "myuser"),
    pass: String(fromUrl.pass || process.env.POSTGRES_PASSWORD || "mypassword"),
    host: String(fromUrl.host || process.env.POSTGRES_HOST || "db"),
    port: String(fromUrl.port || process.env.POSTGRES_PORT || "5432"),
  };
}

function runShell(cmd: string, pass: string): void {
  execSync(cmd, {
    stdio: "pipe",
    env: { ...process.env, PGPASSWORD: pass },
  });
}

function classifyBackup(fileName: string, content: Buffer): {
  fileType: "sql" | "dump";
  backupType: "schema+data" | "data-only";
} {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".dump" || ext === ".backup") {
    return { fileType: "dump", backupType: "schema+data" };
  }
  const text = content.toString("utf8");
  const hasSchema =
    text.includes("CREATE TABLE") ||
    text.includes("CREATE SCHEMA") ||
    text.includes("ALTER TABLE");
  return {
    fileType: "sql",
    backupType: hasSchema ? "schema+data" : "data-only",
  };
}

function removePgMigrationsData(sqlContent: string): string {
  const withoutCopy = sqlContent.replace(
    /COPY\s+public\.pgmigrations\s+\([^)]+\)\s+FROM\s+stdin;[\s\S]*?\\\.\s*$/gm,
    "-- COPY pgmigrations skipped"
  );
  return withoutCopy.replace(
    /^INSERT INTO\s+public\.pgmigrations[\s\S]*?;$/gm,
    "-- INSERT pgmigrations skipped"
  );
}

async function reindexSearch(): Promise<{
  albumsIndexed: number;
  tracksIndexed: number;
  warning: string | null;
}> {
  let albumsIndexed = 0;
  let tracksIndexed = 0;
  let warning: string | null = null;

  try {
    const meiliClient = getMeiliClient();

    const albumsIndex = await getOrCreateAlbumsIndex(meiliClient);
    await configureAlbumsIndex(albumsIndex);
    const albumsRes = await dbQuery<{
      release_id: string;
      friend_id: number;
      username: string | null;
      title: string;
      artist: string;
      year: string | null;
      genres: string[] | null;
      styles: string[] | null;
      album_thumbnail: string | null;
      discogs_url: string | null;
      date_added: string | null;
      date_changed: string | null;
      track_count: number | null;
      album_rating: number | null;
      album_notes: string | null;
      purchase_price: number | null;
      condition: string | null;
      label: string | null;
      catalog_number: string | null;
      country: string | null;
      format: string | null;
      library_identifier: string | null;
    }>(`
      SELECT
        a.release_id,
        a.friend_id,
        f.username,
        a.title,
        a.artist,
        a.year,
        a.genres,
        a.styles,
        a.album_thumbnail,
        a.discogs_url,
        a.date_added,
        a.date_changed,
        a.track_count,
        a.album_rating,
        a.album_notes,
        a.purchase_price,
        a.condition,
        a.label,
        a.catalog_number,
        a.country,
        a.format,
        a.library_identifier
      FROM albums a
      LEFT JOIN friends f ON f.id = a.friend_id
    `);
    await albumsIndex.deleteAllDocuments();
    const albumDocs = albumsRes.rows.map((row) => ({
      id: `${row.release_id}_${row.friend_id}`,
      ...row,
    }));
    if (albumDocs.length > 0) {
      await albumsIndex.addDocuments(albumDocs);
    }
    albumsIndexed = albumDocs.length;

    const tracksIndex = await getOrCreateTracksIndex(meiliClient);
    await configureMeiliIndex(tracksIndex, meiliClient);
    const tracksRes = await dbQuery<Record<string, unknown> & {
      username_resolved?: string | null;
      username?: string | null;
    }>(`
      SELECT
        t.*,
        a.library_identifier,
        COALESCE(f.username, t.username) AS username_resolved
      FROM tracks t
      LEFT JOIN albums a
        ON t.release_id = a.release_id AND t.friend_id = a.friend_id
      LEFT JOIN friends f
        ON t.friend_id = f.id
    `);
    await tracksIndex.deleteAllDocuments();
    const trackDocs = tracksRes.rows.map((row) => {
      const normalized: Record<string, unknown> = {
        ...row,
        username: row.username_resolved ?? row.username ?? null,
      };
      delete normalized.username_resolved;
      return normalized;
    });
    if (trackDocs.length > 0) {
      await addTracksToMeili(tracksIndex, trackDocs as Track[]);
    }
    tracksIndexed = trackDocs.length;
  } catch (error) {
    warning = error instanceof Error ? error.message : String(error);
  }

  return { albumsIndexed, tracksIndexed, warning };
}

export async function restoreDatabaseFromUpload(file: File): Promise<RestoreResult> {
  const restoreDir = path.resolve("dumps");
  if (!fs.existsSync(restoreDir)) {
    fs.mkdirSync(restoreDir, { recursive: true });
  }

  const content = Buffer.from(await file.arrayBuffer());
  const { fileType, backupType } = classifyBackup(file.name, content);
  const restorePath = path.join(
    restoreDir,
    fileType === "dump" ? "restore.dump" : "restore.sql"
  );
  fs.writeFileSync(restorePath, content);

  const pg = getPgConfig();

  // Always do full schema restore semantics.
  const cleanSql = `
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO ${pg.user};
GRANT ALL ON SCHEMA public TO public;
`;
  const cleanPath = path.join(restoreDir, "restore-clean.sql");
  fs.writeFileSync(cleanPath, cleanSql);
  runShell(
    `psql -U ${pg.user} -h ${pg.host} -p ${pg.port} -d ${pg.db} -f '${cleanPath}'`,
    pg.pass
  );

  // Data-only backups need schema created first.
  if (backupType === "data-only") {
    runShell("npm run migrate up", pg.pass);
  }

  if (fileType === "dump") {
    runShell(
      `pg_restore -U ${pg.user} -h ${pg.host} -p ${pg.port} -d ${pg.db} --single-transaction --no-owner --no-acl '${restorePath}'`,
      pg.pass
    );
  } else {
    const sqlContent = fs.readFileSync(restorePath, "utf8");
    const filteredPath = path.join(restoreDir, "restore-filtered.sql");
    fs.writeFileSync(filteredPath, removePgMigrationsData(sqlContent));
    runShell(
      `psql -U ${pg.user} -h ${pg.host} -p ${pg.port} -d ${pg.db} --single-transaction -v ON_ERROR_STOP=1 -q -f '${filteredPath}'`,
      pg.pass
    );
  }

  const reindex = await reindexSearch();
  return {
    message: "Database schema and data restored successfully.",
    backupType,
    fileType,
    reindex,
  };
}
