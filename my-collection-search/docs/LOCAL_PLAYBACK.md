# Local DAC Playback Implementation Guide

This document explains how to use and integrate the local USB DAC playback feature in your Next.js application.

## Overview

The application supports two playback modes:

1. **Browser Playback** (default): Audio plays through the web browser using HTML5 `<audio>` element
2. **Local DAC Playback**: Audio plays server-side through a USB DAC connected to the Docker host

## Architecture

```
┌─────────────────┐
│   React UI      │
│  (Browser)      │
└────────┬────────┘
         │
    ┌────▼─────────────────┐
    │ PlaybackMode Toggle  │
    └────┬─────────────┬───┘
         │             │
    ┌────▼──┐     ┌────▼─────────────┐
    │Browser│     │ /api/playback/   │
    │Audio  │     │  local (POST)    │
    └───────┘     └────┬─────────────┘
                       │
                  ┌────▼──────────────┐
                  │LocalPlaybackService│
                  │   (ffplay)        │
                  └────┬──────────────┘
                       │
                  ┌────▼────┐
                  │USB DAC  │
                  │(ALSA)   │
                  └─────────┘
```

## Backend Components

### 1. LocalPlaybackService (`src/services/localPlaybackService.ts`)

Manages server-side audio playback using `ffplay` (from ffmpeg package).

**Features:**
- Play audio files through ALSA device
- Pause/resume playback
- Stop playback
- Get playback status
- Test ffplay availability

**Environment Variables:**
- `ENABLE_AUDIO_PLAYBACK`: Set to 'true' to enable local DAC playback
- `AUDIO_DEVICE`: ALSA device name (e.g., 'default', 'hw:1,0', 'plughw:1,0')

**Example Usage:**
```typescript
import { localPlaybackService } from '@/services/localPlaybackService';

// Play a track
await localPlaybackService.play('my-track.mp3');

// Pause
localPlaybackService.pause();

// Resume
localPlaybackService.resume();

// Stop
localPlaybackService.stop();

// Get status
const status = localPlaybackService.getStatus();
console.log(status.state); // 'playing', 'paused', 'stopped', or 'idle'
```

### 2. API Routes

#### `/api/playback/local` (POST)

Control local playback.

**Request Body:**
```json
{
  "action": "play" | "pause" | "resume" | "stop",
  "filename": "track.mp3" // Required for 'play' action
}
```

**Response:**
```json
{
  "success": true,
  "status": {
    "state": "playing",
    "currentTrack": "track.mp3",
    "position": 0,
    "duration": 0
  }
}
```

#### `/api/playback/local` (GET)

Get current playback status.

**Response:**
```json
{
  "enabled": true,
  "status": {
    "state": "playing",
    "currentTrack": "track.mp3",
    "position": 0,
    "duration": 0
  }
}
```

#### `/api/playback/test` (GET)

Test if local playback is available and configured correctly.

**Response:**
```json
{
  "available": true,
  "message": "Local playback is available and configured correctly",
  "config": {
    "ENABLE_AUDIO_PLAYBACK": "true",
    "AUDIO_DEVICE": "hw:1,0"
  },
  "testResult": {
    "success": true
  }
}
```

## Frontend Components

### 1. PlaybackModeSelector

UI component for toggling between browser and local DAC playback.

**Usage:**
```typescript
import PlaybackModeSelector from '@/components/PlaybackModeSelector';
import { usePlaybackMode } from '@/hooks/usePlaybackMode';

function MyPlayer() {
  const { mode, setMode } = usePlaybackMode();

  return (
    <PlaybackModeSelector
      value={mode}
      onChange={setMode}
      compact={false}
    />
  );
}
```

**Props:**
- `value`: Current playback mode ('browser' | 'local-dac')
- `onChange`: Callback when mode changes
- `disabled`: Disable the selector (optional)
- `compact`: Use compact layout (optional)

### 2. usePlaybackMode Hook

Manages playback mode state with localStorage persistence.

```typescript
import { usePlaybackMode } from '@/hooks/usePlaybackMode';

const { mode, setMode } = usePlaybackMode();

// mode: 'browser' | 'local-dac'
// setMode: (mode: PlaybackMode) => void
```

### 3. useLocalPlayback Hook

Provides functions to control local DAC playback.

```typescript
import { useLocalPlayback } from '@/hooks/usePlaybackMode';

const { play, pause, resume, stop } = useLocalPlayback();

// Play a track
await play('my-track.mp3');

// Pause playback
await pause();

// Resume playback
await resume();

// Stop playback
await stop();
```

## Integration Example

Here's how to integrate local DAC playback into the existing PlaylistPlayerProvider:

### Step 1: Add Playback Mode to PlayerControls

```typescript
// src/components/PlayerControls.tsx
import PlaybackModeSelector from '@/components/PlaybackModeSelector';
import { usePlaybackMode, useLocalPlayback } from '@/hooks/usePlaybackMode';

export default function PlayerControls({ /* ... */ }) {
  const { mode, setMode } = usePlaybackMode();
  const localPlayback = useLocalPlayback();
  const {
    isPlaying,
    currentTrack,
    play,
    pause,
    // ... other player context values
  } = usePlaylistPlayer();

  // Handle playback mode change
  const handleModeChange = (newMode: PlaybackMode) => {
    // Stop current playback when switching modes
    if (isPlaying) {
      pause();
      if (mode === 'local-dac') {
        localPlayback.stop();
      }
    }
    setMode(newMode);
  };

  return (
    <Box>
      {/* Existing player controls */}

      {/* Add playback mode selector */}
      <PlaybackModeSelector
        value={mode}
        onChange={handleModeChange}
        compact={compact}
      />

      {/* Rest of player UI */}
    </Box>
  );
}
```

### Step 2: Modify Play/Pause Logic

```typescript
// In your play/pause handlers
const handlePlay = async () => {
  if (mode === 'local-dac') {
    // Use local DAC playback
    if (currentTrack?.local_audio_url) {
      try {
        await localPlayback.play(currentTrack.local_audio_url);
      } catch (error) {
        console.error('Local playback failed:', error);
        // Fall back to browser playback
        setMode('browser');
        play(); // Use browser playback
      }
    }
  } else {
    // Use browser playback (existing behavior)
    play();
  }
};

const handlePause = async () => {
  if (mode === 'local-dac') {
    await localPlayback.pause();
  } else {
    pause();
  }
};
```

### Step 3: Handle Track Changes

```typescript
// When currentTrack changes and isPlaying is true
useEffect(() => {
  if (isPlaying && currentTrack && mode === 'local-dac') {
    // Play new track on local DAC
    if (currentTrack.local_audio_url) {
      localPlayback.play(currentTrack.local_audio_url).catch((error) => {
        console.error('Failed to play on local DAC:', error);
        // Fall back to browser
        setMode('browser');
      });
    }
  }
}, [currentTrack, isPlaying, mode]);
```

## Docker Configuration

Ensure your Docker setup includes:

### 1. Device Passthrough

In `docker-compose.prod.yml`:
```yaml
services:
  app:
    devices:
      - /dev/snd:/dev/snd  # Pass all audio devices
    environment:
      ENABLE_AUDIO_PLAYBACK: ${ENABLE_AUDIO_PLAYBACK:-false}
      AUDIO_DEVICE: ${AUDIO_DEVICE:-default}
```

### 2. ffmpeg Installation

Add to your Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
```

### 3. Environment Variables

In `.env`:
```env
ENABLE_AUDIO_PLAYBACK=true
AUDIO_DEVICE=hw:1,0
```

## Testing

### 1. Test Backend Availability

```bash
curl http://localhost:3000/api/playback/test
```

Expected response if configured correctly:
```json
{
  "available": true,
  "message": "Local playback is available and configured correctly"
}
```

### 2. Test Playback

```bash
# Play a track
curl -X POST http://localhost:3000/api/playback/local \
  -H "Content-Type: application/json" \
  -d '{"action": "play", "filename": "test.mp3"}'

# Pause
curl -X POST http://localhost:3000/api/playback/local \
  -H "Content-Type: application/json" \
  -d '{"action": "pause"}'

# Stop
curl -X POST http://localhost:3000/api/playback/local \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

### 3. Test from Container

```bash
# Verify ffplay is available
docker exec -it myapp ffplay -version

# Test audio device
docker exec -it myapp aplay -l

# Play a test file
docker exec -it myapp ffplay -nodisp -autoexit /app/audio/test.mp3
```

## Troubleshooting

### "ffplay not found"

Install ffmpeg in your Docker container:
```dockerfile
RUN apt-get update && apt-get install -y ffmpeg
```

### "Permission denied" on /dev/snd

Ensure device passthrough is configured in docker-compose and the container has access:
```yaml
devices:
  - /dev/snd:/dev/snd
```

### No Audio Output

1. Check ALSA device name:
   ```bash
   docker exec -it myapp aplay -l
   ```

2. Verify device in environment:
   ```bash
   docker exec -it myapp env | grep AUDIO_DEVICE
   ```

3. Test with speaker-test:
   ```bash
   docker exec -it myapp speaker-test -D hw:1,0 -t wav -c 2
   ```

### Audio Cuts Out or Stutters

Try using `plughw` instead of `hw` for better compatibility:
```env
AUDIO_DEVICE=plughw:1,0
```

## Limitations

1. **Position/Duration**: The current implementation doesn't track playback position. ffplay doesn't easily expose this information.

2. **Volume Control**: Volume is controlled at the ALSA/DAC level, not through the web UI.

3. **Seeking**: Seeking/scrubbing is not currently supported in local DAC mode.

4. **Linux Only**: Local DAC playback only works on Linux hosts due to ALSA dependency.

5. **Single Stream**: Only one track can play at a time through the local DAC.

## Future Enhancements

- [ ] Add playback position tracking
- [ ] Support volume control via ALSA mixer
- [ ] Implement seeking/scrubbing
- [ ] Add visualizer/waveform display
- [ ] Support multiple simultaneous playback streams
- [ ] Add crossfade between tracks
- [ ] Implement EQ controls
