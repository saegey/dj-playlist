import { NextResponse } from 'next/server';
import { localPlaybackService } from '@/services/localPlaybackService';

/**
 * POST /api/playback/local
 * Control local DAC playback
 *
 * Body: { action: 'play' | 'pause' | 'resume' | 'stop', filename?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, filename } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'play':
        if (!filename) {
          return NextResponse.json(
            { error: 'Missing filename for play action' },
            { status: 400 }
          );
        }
        await localPlaybackService.play(filename);
        return NextResponse.json({
          success: true,
          status: localPlaybackService.getStatus(),
        });

      case 'pause':
        localPlaybackService.pause();
        return NextResponse.json({
          success: true,
          status: localPlaybackService.getStatus(),
        });

      case 'resume':
        localPlaybackService.resume();
        return NextResponse.json({
          success: true,
          status: localPlaybackService.getStatus(),
        });

      case 'stop':
        localPlaybackService.stop();
        return NextResponse.json({
          success: true,
          status: localPlaybackService.getStatus(),
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Local playback error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/playback/local
 * Get current playback status
 */
export async function GET() {
  try {
    const status = localPlaybackService.getStatus();
    const isEnabled = localPlaybackService.isLocalPlaybackEnabled();

    return NextResponse.json({
      enabled: isEnabled,
      status,
    });
  } catch (error) {
    console.error('Error getting playback status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
