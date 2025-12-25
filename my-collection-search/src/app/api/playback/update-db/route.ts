import { NextResponse } from 'next/server';
import { localPlaybackService } from '@/services/localPlaybackService';

/**
 * POST /api/playback/update-db
 * Triggers MPD database update to scan for new audio files
 */
export async function POST() {
  try {
    if (!localPlaybackService.isLocalPlaybackEnabled()) {
      return NextResponse.json(
        { error: 'Local playback is not enabled' },
        { status: 400 }
      );
    }

    await localPlaybackService.updateDatabase();

    return NextResponse.json({
      success: true,
      message: 'MPD database update triggered',
    });
  } catch (error) {
    console.error('[API] MPD database update failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to update MPD database',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
