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
        const playStatus = await localPlaybackService.getStatus();
        return NextResponse.json({
          success: true,
          status: playStatus,
        });

      case 'pause':
        await localPlaybackService.pause();
        const pauseStatus = await localPlaybackService.getStatus();
        return NextResponse.json({
          success: true,
          status: pauseStatus,
        });

      case 'resume':
        await localPlaybackService.resume();
        const resumeStatus = await localPlaybackService.getStatus();
        return NextResponse.json({
          success: true,
          status: resumeStatus,
        });

      case 'stop':
        await localPlaybackService.stop();
        const stopStatus = await localPlaybackService.getStatus();
        return NextResponse.json({
          success: true,
          status: stopStatus,
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
    const status = await localPlaybackService.getStatus();
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
