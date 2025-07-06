

import { NextResponse } from 'next/server';
import { updateTrack } from '@/lib/db';
import { MeiliSearch } from 'meilisearch';

export async function PATCH(req: Request) {
  try {
    const data = await req.json();
    const updated = await updateTrack(data);
    if (!updated) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Update MeiliSearch index
    try {
      const client = new MeiliSearch({ host: process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700', apiKey: process.env.MEILISEARCH_API_KEY || 'masterKey' });
      const index = client.index('tracks');
      await index.updateDocuments([updated]);
    } catch (meiliError) {
      console.error('Failed to update MeiliSearch:', meiliError);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating track:', error);
    return NextResponse.json({ error: 'Failed to update track' }, { status: 500 });
  }
}
