# DJ Transition Tester 🎧

A dual-deck audio player for testing track transitions in playlists, inspired by Logic Pro X.

## What I Built

### ✅ Features Implemented

1. **Dual-Deck Audio Player**
   - Independent playback for Deck A and Deck B
   - Play/pause/stop controls per deck
   - Seek bar for each deck
   - Real-time position tracking

2. **Volume Controls**
   - Individual volume sliders for each deck (0-100%)
   - Visual feedback showing current volume level

3. **Crossfader**
   - Master crossfade between decks
   - Constant-power crossfade curve (smoother than linear)
   - Visual indicator showing mix position

4. **Pitch/Tempo Control**
   - ±20% pitch/tempo adjustment per deck
   - Real-time BPM display (adjusted for playback rate)
   - "Sync BPM" button to auto-match track tempos

5. **Track Information Display**
   - Title, artist, key, BPM
   - Current time / total duration
   - Color-coded deck labels (A = blue, B = orange)

## Files Created

```
src/
├── lib/audio/
│   └── audioEngine.ts              # Web Audio API engine
├── hooks/
│   └── useAudioEngine.ts           # React hook for audio management
├── components/TransitionTester/
│   ├── TransitionTester.tsx        # Main container component
│   ├── Deck.tsx                    # Individual deck component
│   └── README.md                   # This file
└── app/transition-test/
    └── page.tsx                    # Test page
```

## How to Use

### Quick Test

1. **Add test audio files:**
   ```bash
   # Place two audio files in /public/audio/
   cp /path/to/track1.m4a /Users/saegey/Projects/dj-playlist/my-collection-search/public/audio/track-a.m4a
   cp /path/to/track2.m4a /Users/saegey/Projects/dj-playlist/my-collection-search/public/audio/track-b.m4a
   ```

2. **Visit test page:**
   ```
   http://localhost:3000/transition-test
   ```

3. **Start testing:**
   - Click "Launch Transition Tester"
   - Play both decks
   - Use crossfader to blend
   - Adjust pitch/tempo as needed

### Integration with Your Playlist

```tsx
import { TransitionTester } from '@/components/TransitionTester/TransitionTester';

function PlaylistViewer({ tracks }) {
  const [testPair, setTestPair] = useState<{ trackA: Track, trackB: Track } | null>(null);

  if (testPair) {
    return (
      <Modal isOpen onClose={() => setTestPair(null)} size="full">
        <TransitionTester
          trackA={testPair.trackA}
          trackB={testPair.trackB}
        />
      </Modal>
    );
  }

  return (
    <div>
      {tracks.map((track, idx) => (
        <div key={track.track_id}>
          <TrackCard track={track} />
          {idx < tracks.length - 1 && (
            <Button
              onClick={() => setTestPair({
                trackA: tracks[idx],
                trackB: tracks[idx + 1]
              })}
            >
              🎧 Test Transition
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
```

## How It Works

### Web Audio API Architecture

```
┌─────────────┐
│   Deck A    │
│  AudioBuffer│
└──────┬──────┘
       │
   ┌───▼────┐
   │ Source │ (playbackRate controlled)
   └───┬────┘
       │
   ┌───▼────┐
   │  Gain  │ (volume + crossfade)
   └───┬────┘
       │
       ├──────────┐
       │          │
   ┌───▼────┐ ┌──▼──────┐
   │ Master │ │  Deck B │
   │  Mix   │ │  (same) │
   └───┬────┘ └─────────┘
       │
   ┌───▼────┐
   │ Output │
   └────────┘
```

### Key Components

**AudioEngine** (`lib/audio/audioEngine.ts`)
- Manages Web Audio API nodes
- Handles playback, seeking, volume
- Implements constant-power crossfade
- Supports pitch/tempo adjustment via playbackRate

**useAudioEngine** (`hooks/useAudioEngine.ts`)
- React hook wrapping AudioEngine
- Manages deck state (playing, volume, time)
- Provides callbacks for UI interactions
- Updates current time via requestAnimationFrame

**Deck** (`components/TransitionTester/Deck.tsx`)
- UI for a single deck
- Transport controls, sliders, track info
- Color-coded by deck (A/B)

**TransitionTester** (`components/TransitionTester/TransitionTester.tsx`)
- Main container
- Loads two tracks
- Renders both decks + crossfader
- Provides BPM sync functionality

## Keyboard Shortcuts (TODO)

Future enhancement:

- `Space` - Play/pause master
- `A` - Play/pause Deck A
- `B` - Play/pause Deck B
- `←/→` - Adjust crossfader
- `Shift + ←/→` - Nudge tempo

## Next Steps

### Phase 2: Waveform Visualization

Add `Waveform.tsx` component using wavesurfer.js:

```bash
npm install wavesurfer.js
```

```tsx
import WaveSurfer from 'wavesurfer.js';

export function Waveform({ audioUrl }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current!,
      waveColor: '#4FD1C5',
      progressColor: '#319795',
      height: 128,
    });

    wavesurfer.load(audioUrl);
    return () => wavesurfer.destroy();
  }, [audioUrl]);

  return <div ref={containerRef} />;
}
```

### Phase 3: Advanced Features

- [ ] Cue points (mark/jump to positions)
- [ ] Loop mode
- [ ] Effects (EQ, reverb, delay)
- [ ] Harmonic mixing indicators
- [ ] Save transition points
- [ ] Export mixed audio

## Browser Compatibility

- ✅ Chrome/Edge (best performance)
- ✅ Firefox
- ✅ Safari (iOS may require user interaction to start audio)

## Troubleshooting

**"Failed to load audio"**
- Check audio file paths in `local_audio_url`
- Verify files exist in `/public/audio/` or served location
- Check browser console for CORS errors

**No sound**
- Check browser allows audio playback
- Verify volume sliders aren't at 0
- Try clicking play after user interaction (required by some browsers)

**Choppy playback**
- Use compressed audio (m4a, mp3) instead of WAV
- Close other tabs using audio
- Check CPU usage

**BPM sync not working**
- Ensure tracks have BPM metadata
- Check BPM values are numbers, not strings
- Manually adjust pitch slider if needed

## Performance Tips

1. **Use compressed audio formats** (m4a, mp3) - smaller = faster load
2. **Preload tracks** - Load next track while current is playing
3. **Limit file size** - 5-10MB max per track
4. **Use CDN** - Serve audio from CDN for production

## Technical Details

### Constant-Power Crossfade

Instead of linear crossfade (which causes volume dip in the middle), we use constant-power:

```typescript
const aDegree = position * Math.PI / 2;
const bDegree = (1 - position) * Math.PI / 2;

deckA.gain = Math.cos(aDegree);  // Cosine curve
deckB.gain = Math.cos(bDegree);  // Inverse cosine
```

This maintains perceived loudness throughout the crossfade.

### BPM Sync Algorithm

```typescript
playbackRate = targetBPM / sourceBPM

// Example: Sync 132 BPM track to 135 BPM
// playbackRate = 135 / 132 = 1.0227
// Result: Track plays 2.27% faster
```

### Playback State Management

The engine tracks:
- `startTime` - When playback began in AudioContext time
- `pauseTime` - Offset in seconds when paused
- `currentTime` - Calculated from `context.currentTime - startTime`

This allows pause/resume without recreating the audio buffer.

## License

MIT - Use freely in your DJ app!

---

Built with ❤️ using Web Audio API, React, and Chakra UI
