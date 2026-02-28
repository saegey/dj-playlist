import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BACKUP_DIR = path.resolve(process.cwd(), 'dumps');

function getPgEnv() {
  return {
    url: process.env.DATABASE_URL,
    db: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    pass: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
  };
}

function parsePgUrl(pgUrl) {
  try {
    const url = new URL(pgUrl);
    return {
      user: url.username,
      pass: url.password,
      host: url.hostname,
      port: url.port || 5432,
      db: url.pathname.replace(/^\//, ''),
    };
  } catch {
    return {};
  }
}

/**
 * Create a backup in PostgreSQL custom format (binary)
 * This format is more reliable for complex data with special characters
 */
export async function POST() {
  try {
    let pg = getPgEnv();
    if (pg.url) {
      pg = { ...pg, ...parsePgUrl(pg.url) };
    }

    if (!pg.db || !pg.user) {
      return new Response(
        JSON.stringify({ error: 'Database connection info not available' }),
        { status: 500 }
      );
    }

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const unique = `${timestamp}-${Math.floor(Math.random() * 1e6)}`;
    const backupFile = path.join(BACKUP_DIR, `pg-backup-custom-${unique}.dump`);

    // Use custom format (-F c) which is binary and handles special characters better
    // Include schema (removed --data-only) to avoid migration conflicts
    const cmd = `PGPASSWORD='${pg.pass || ''}' pg_dump -U ${pg.user} -h ${
      pg.host || 'localhost'
    } -p ${pg.port || 5432} -F c -d ${pg.db} -f '${backupFile}'`;

    execSync(cmd, {
      stdio: 'pipe',
      env: { ...process.env, PGPASSWORD: pg.pass || '' },
    });

    return new Response(
      JSON.stringify({
        message: `Custom format backup created: ${path.basename(backupFile)}`,
        filename: path.basename(backupFile),
        format: 'custom',
      }),
      { status: 200 }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500 }
    );
  }
}
