import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.resolve(process.cwd(), 'dumps');

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function GET() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return new Response(JSON.stringify({ files: [] }), { status: 200, headers: JSON_HEADERS });
    }
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => b.localeCompare(a)); // newest first
    return new Response(JSON.stringify({ files }), { status: 200, headers: JSON_HEADERS });
  } catch (e) {
    console.error('[backups] GET error:', e);
    return new Response(JSON.stringify({ error: 'Failed to list backups' }), { status: 500, headers: JSON_HEADERS });
  }
}
