# Docker Compose Platform-Specific Configuration

## macOS (ARM64/Intel)

MPD (Music Player Daemon) requires Linux audio devices (`/dev/snd`) which don't exist on macOS. Use the macOS override to disable MPD:

### Automatic (Recommended)
The Makefile automatically detects macOS and applies the override:
```bash
make compose-dev
```

### Manual
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.mac.yml up
```

## Linux (x86_64/ARM64)

MPD works natively on Linux with audio device passthrough:

```bash
make compose-dev
# or
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Enable Audio Playback on Linux

1. Set environment variable:
   ```bash
   export ENABLE_AUDIO_PLAYBACK=true
   ```

2. Configure your USB DAC device in `.env`:
   ```bash
   AUDIO_DEVICE=hw:1,0  # Adjust based on your device
   ```

3. Check available audio devices:
   ```bash
   aplay -l
   ```

## Override Files Explained

- **docker-compose.yml** - Base configuration (all platforms)
- **docker-compose.dev.yml** - Development overrides (hot reload, local volumes)
- **docker-compose.mac.yml** - macOS-specific (disables MPD)
- **docker-compose.prod.yml** - Production (pre-built images from registry)

## Services Disabled on macOS

- **mpd** - Music Player Daemon (requires Linux `/dev/snd` devices)

## Local Audio Playback on macOS

Since MPD doesn't work on macOS, the app falls back to browser-based audio playback automatically. To use external DAC on macOS:

1. Use browser mode (default)
2. Or use AirPlay to stream to another device
3. Or run MPD on a separate Linux machine/Raspberry Pi and connect remotely

## Troubleshooting

### Error: "no such file or directory" for /dev/snd
This means you're running on macOS without the override. Use:
```bash
make compose-dev  # Auto-detects macOS
# or
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.mac.yml up
```

### MPD Won't Start
Check if running on macOS - MPD requires Linux. Use the mac override to disable it.
