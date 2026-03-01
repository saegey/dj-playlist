import { NextResponse } from 'next/server';
import { localPlaybackService } from '@/server/services/localPlaybackService';

/**
 * GET /api/playback/test
 * Test if local playback is available and configured correctly
 */
export async function GET() {
  try {
    const isEnabled = localPlaybackService.isLocalPlaybackEnabled();

    if (!isEnabled) {
      return NextResponse.json({
        available: false,
        message: 'Local playback is disabled. Set ENABLE_AUDIO_PLAYBACK=true to enable.',
        config: {
          ENABLE_AUDIO_PLAYBACK: process.env.ENABLE_AUDIO_PLAYBACK,
          AUDIO_DEVICE: process.env.AUDIO_DEVICE,
          MPD_HOST: process.env.MPD_HOST,
          MPD_PORT: process.env.MPD_PORT,
          MPD_PATH_PREFIX: process.env.MPD_PATH_PREFIX,
        },
      });
    }

    const testResult = await localPlaybackService.testPlayback();

    return NextResponse.json({
      available: testResult.success,
      message: testResult.success
        ? 'Local playback is available and configured correctly'
        : `Local playback test failed: ${testResult.error}`,
      config: {
        ENABLE_AUDIO_PLAYBACK: process.env.ENABLE_AUDIO_PLAYBACK,
        AUDIO_DEVICE: process.env.AUDIO_DEVICE,
        MPD_HOST: process.env.MPD_HOST,
        MPD_PORT: process.env.MPD_PORT,
        MPD_PATH_PREFIX: process.env.MPD_PATH_PREFIX,
      },
      testResult,
    });
  } catch (error) {
    console.error('Playback test error:', error);
    return NextResponse.json(
      {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
