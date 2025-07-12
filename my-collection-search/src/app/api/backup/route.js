import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// This assumes your DB file is at the project root as 'djplaylist_backup_2025-07-10.sql' or similar
// Adjust DB_PATH as needed for your actual DB file
const DB_PATH = path.resolve(process.cwd(), 'djplaylist_backup_2025-07-10.sql');
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
  // Example: postgres://user:pass@host:port/dbname
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

export async function POST() {
  try {
    let pg = getPgEnv();
    // If POSTGRES_URL is set, parse it for connection info
    if (pg.url) {
      pg = { ...pg, ...parsePgUrl(pg.url) };
      console.log('Using POSTGRES_URL:', pg.url);
    }
    let backupFile;
    let usedPg = false;
    if (pg.db && pg.user) {
      if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const unique = `${timestamp}-${Math.floor(Math.random() * 1e6)}`;
      backupFile = path.join(BACKUP_DIR, `pg-backup-${unique}.sql`);
      // Compose pg_dump command
      let cmd = `PGPASSWORD='${pg.pass || ''}' pg_dump -U ${pg.user} -h ${pg.host || 'localhost'} -p ${pg.port || 5432} -F p -d ${pg.db} -f '${backupFile}'`;
      execSync(cmd, { stdio: 'ignore', env: { ...process.env, PGPASSWORD: pg.pass || '' } });
      usedPg = true;
    }
    if (!usedPg) {
      // Fallback to file copy
      if (!fs.existsSync(DB_PATH)) {
        return new Response(JSON.stringify({ error: 'Database file not found.' }), { status: 404 });
      }
      if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const unique = `${timestamp}-${Math.floor(Math.random() * 1e6)}`;
      backupFile = path.join(BACKUP_DIR, `db-backup-${unique}.sql`);
      fs.copyFileSync(DB_PATH, backupFile);
    }
    return new Response(JSON.stringify({ message: `Backup created: ${path.basename(backupFile)}` }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500 });
  }
}
