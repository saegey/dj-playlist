import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { Pool } from "pg";
import { getMeiliClient } from "@/lib/meili";
import { getOrCreateAlbumsIndex, configureAlbumsIndex } from "@/services/albumMeiliService";
import { getOrCreateTracksIndex, configureMeiliIndex } from "@/services/meiliIndexService";
import { addTracksToMeili } from "@/services/meiliDocumentService";

function parsePgUrl(pgUrl: string) {
  try {
    const url = new URL(pgUrl);
    return {
      user: url.username,
      pass: url.password,
      host: url.hostname,
      port: url.port || 5432,
      db: url.pathname.replace(/^\//, ""),
    };
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    // Save uploaded file to /app/dumps/restore.sql
    const restoreDir = path.resolve("dumps");
    if (!fs.existsSync(restoreDir))
      fs.mkdirSync(restoreDir, { recursive: true });
    const restorePath = path.join(restoreDir, "restore.sql");
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(restorePath, Buffer.from(arrayBuffer));

    // Get DB connection info from env
    let pg = {
      url: process.env.DATABASE_URL,
      db: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      pass: process.env.POSTGRES_PASSWORD,
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
    };
    if (pg.url) {
      const parsed = parsePgUrl(pg.url);
      pg = {
        ...pg,
        ...{ ...parsed, port: parsed.port ? String(parsed.port) : undefined },
      };
    }
    const db = pg.db || "mydb";
    const user = pg.user || "myuser";
    const pass = pg.pass || "mypassword";
    const host = pg.host || "db";
    const port = pg.port || "5432";

    // Delete data from all tables (keep schema intact)
    console.log("[Restore] Cleaning data from all tables...");
    const cleanScript = `
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Disable triggers to avoid foreign key issues
    SET session_replication_role = replica;

    -- Truncate all tables INCLUDING pgmigrations
    -- (We'll skip pgmigrations data during restore to avoid conflicts)
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;

    -- Re-enable triggers
    SET session_replication_role = DEFAULT;
END $$;
`;
    const cleanPath = path.join(restoreDir, "clean.sql");
    fs.writeFileSync(cleanPath, cleanScript);

    // Run the clean script
    const cleanCmd = `PGPASSWORD='${pass}' psql -U ${user} -h ${host} -p ${port} -d ${db} -f '${cleanPath}'`;
    try {
      execSync(cleanCmd, {
        stdio: "pipe",
        env: { ...process.env, PGPASSWORD: pass },
      });
      console.log("[Restore] Data cleaned successfully");
    } catch (cleanError) {
      const errorOutput = cleanError instanceof Error && 'stderr' in cleanError
        ? (cleanError as any).stderr?.toString() || cleanError.message
        : String(cleanError);
      console.warn("[Restore] Clean warning:", errorOutput);
    }

    // Pre-process SQL file to remove pgmigrations COPY blocks
    console.log("[Restore] Pre-processing backup file...");
    const sqlContent = fs.readFileSync(restorePath, 'utf8');

    // Remove COPY pgmigrations block (to avoid conflicts with current migrations)
    const filteredSql = sqlContent.replace(
      /COPY\s+public\.pgmigrations\s+\([^)]+\)\s+FROM\s+stdin;[\s\S]*?\\\.\s*$/gm,
      '-- COPY pgmigrations skipped to avoid conflicts'
    );

    const filteredPath = path.join(restoreDir, "restore-filtered.sql");
    fs.writeFileSync(filteredPath, filteredSql);

    // Run psql restore with proper options for COPY statements
    // --single-transaction: Run restore in a single transaction
    // -v ON_ERROR_STOP=1: Stop on first error (but within transaction)
    // -q: Quiet mode (reduce output noise)
    const cmd = `PGPASSWORD='${pass}' psql -U ${user} -h ${host} -p ${port} -d ${db} --single-transaction -v ON_ERROR_STOP=1 -q -f '${filteredPath}'`;
    try {
      execSync(cmd, {
        stdio: "pipe",
        env: { ...process.env, PGPASSWORD: pass },
      });
      console.log("[Restore] Backup restored successfully (pgmigrations skipped)");
    } catch (execError) {
      // Capture stderr for better error messages
      const errorOutput = execError instanceof Error && 'stderr' in execError
        ? (execError as any).stderr?.toString() || execError.message
        : String(execError);
      throw new Error(`Database restore failed: ${errorOutput}`);
    }

    // Re-run migrations to ensure pgmigrations is up to date
    console.log("[Restore] Re-running migrations to update history...");
    try {
      execSync("npm run migrate up", {
        stdio: "pipe",
        cwd: process.cwd(),
      });
    } catch (migrateError) {
      // Ignore errors - migrations are already applied
      console.log("[Restore] Migrations already up to date");
    }

    let albumsIndexed = 0;
    let tracksIndexed = 0;
    let reindexWarning: string | null = null;

    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const meiliClient = getMeiliClient();

      // Reindex albums from restored DB
      const albumsIndex = await getOrCreateAlbumsIndex(meiliClient);
      await configureAlbumsIndex(albumsIndex);
      const albumsRes = await pool.query(`
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
      const albumDocs = albumsRes.rows.map((row) => ({
        id: `${row.release_id}_${row.friend_id}`,
        ...row,
      }));
      await albumsIndex.deleteAllDocuments();
      if (albumDocs.length > 0) {
        await albumsIndex.addDocuments(albumDocs);
      }
      albumsIndexed = albumDocs.length;

      // Reindex tracks from restored DB
      const tracksIndex = await getOrCreateTracksIndex(meiliClient);
      await configureMeiliIndex(tracksIndex, meiliClient);
      const tracksRes = await pool.query(`
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
      const trackDocs = tracksRes.rows.map((row) => {
        const normalized = { ...row };
        normalized.username = row.username_resolved;
        delete normalized.username_resolved;
        return normalized;
      });
      await tracksIndex.deleteAllDocuments();
      if (trackDocs.length > 0) {
        await addTracksToMeili(tracksIndex, trackDocs);
      }
      tracksIndexed = trackDocs.length;

      await pool.end();
    } catch (reindexError) {
      reindexWarning =
        reindexError instanceof Error
          ? reindexError.message
          : String(reindexError);
    }

    return NextResponse.json({
      message: "Database cleaned and restored successfully.",
      reindex: {
        albumsIndexed,
        tracksIndexed,
        warning: reindexWarning,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
