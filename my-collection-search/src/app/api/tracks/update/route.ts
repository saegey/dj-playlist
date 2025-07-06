import { NextResponse } from 'next/server';
import { updateTrack } from '@/lib/db';

export async function PATCH(req: Request) {
  try {
    const data = await req.json();
    const updated = await updateTrack(data);
    if (!updated) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update track' }, { status: 500 });
  }
}
