import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.resolve(process.cwd(), 'dumps');

export async function GET() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return new Response(JSON.stringify({ files: [] }), { status: 200 });
    }
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => b.localeCompare(a)); // newest first
    return new Response(JSON.stringify({ files }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500 });
  }
}
