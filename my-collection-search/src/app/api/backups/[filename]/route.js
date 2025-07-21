import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.resolve(process.cwd(), 'dumps');

export async function GET(req, { params }) {
  try {
    const { filename } = params;
    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return new Response('File not found', { status: 404 });
    }
    const fileBuffer = fs.readFileSync(filePath);
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500 });
  }
}
