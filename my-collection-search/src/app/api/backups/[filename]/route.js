import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.resolve(process.cwd(), 'dumps');

export async function GET(_req, context) {
  try {
    const { filename } = await context.params;
    if (!filename || typeof filename !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing backup filename' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prevent path traversal (only allow plain filenames from dumps/).
    const safeFilename = path.basename(filename);
    if (safeFilename !== filename) {
      return new Response(JSON.stringify({ error: 'Invalid backup filename' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const filePath = path.join(BACKUP_DIR, safeFilename);
    if (!fs.existsSync(filePath)) {
      return new Response('File not found', { status: 404 });
    }
    const fileBuffer = fs.readFileSync(filePath);
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
      },
    });
  } catch (e) {
    console.error('[backups/filename] GET error:', e);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve backup file' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
