# AirPlay Receiver Setup Guide

This guide explains how to add AirPlay receiver functionality to your GrooveNET setup, allowing you to stream audio from iOS devices, Macs, and other AirPlay sources directly to your USB DAC.

## Overview

With AirPlay receiver enabled, your Intel NUC becomes a network audio endpoint that appears in the AirPlay menu on your Apple devices. You can:

- Stream music from Apple Music, Spotify, or any iOS app to your USB DAC
- Use your high-quality DAC for AirPlay without needing additional hardware
- Optionally run AirPlay and the Next.js app playback simultaneously (with dmix)

## Architecture Options

There are **three ways** to configure AirPlay with your USB DAC:

### Option 1: Simple (First-Come-First-Served) ⭐ Recommended for beginners

**How it works:**
- Only one application can use the USB DAC at a time
- Whichever starts playing first gets exclusive access
- The other application will fail or wait until the DAC is free

**Pros:**
- Simplest configuration
- No audio quality compromise
- Low CPU usage

**Cons:**
- Can't play from both AirPlay and Next.js app simultaneously
- May need to manually stop one to use the other

### Option 2: Software Mixing with dmix ⭐ Recommended for most users

**How it works:**
- ALSA's dmix plugin mixes multiple audio streams in software
- Both AirPlay and the Next.js app can play simultaneously
- Mixed audio is sent to the USB DAC

**Pros:**
- Play from both sources at the same time
- No manual intervention needed
- Good for multi-user scenarios

**Cons:**
- Slight CPU overhead for mixing
- Minimal audio quality impact (usually imperceptible)
- Requires additional configuration

### Option 3: Coordinated Playback (with Hooks)

**How it works:**
- When AirPlay session starts, automatically pause Next.js app playback
- When AirPlay session ends, app playback can optionally resume
- Managed via shairport-sync session hooks

**Pros:**
- Clean switching between sources
- No simultaneous playback (if you prefer that)
- Can be customized with custom scripts

**Cons:**
- More complex setup
- Requires scripting
- Less flexible for multi-user scenarios

---

## Setup Instructions

### Prerequisites

- USB DAC configured and working (see main README)
- Docker and Docker Compose installed
- Network connectivity (AirPlay uses mDNS/Bonjour for discovery)

### Step 1: Choose Your Configuration Method

Pick one of the three options above based on your needs. **We recommend Option 2 (dmix)** for most users.

---

## Option 1: Simple Setup (First-Come-First-Served)

### 1. Enable Shairport Sync Service

Edit `docker-compose.prod.yml` (or `docker-compose.yml` for local build):

```yaml
# Uncomment the entire shairport-sync service block (around line 113)
shairport-sync:
  image: mikebrady/shairport-sync:latest
  container_name: shairport-sync
  network_mode: host  # Required for AirPlay discovery
  restart: unless-stopped
  environment:
    - AIRPLAY_NAME=${AIRPLAY_NAME:-GrooveNET Audio}
  devices:
    - /dev/snd:/dev/snd
  volumes:
    - ./config/shairport-sync.conf:/etc/shairport-sync.conf:ro
```

### 2. Configure Shairport Sync

Edit `config/shairport-sync.conf`:

```conf
alsa = {
  // Direct hardware access (exclusive mode)
  output_device = "hw:1,0";  // Change '1' to your USB DAC card number

  mixer_control_name = "PCM";
  mixer_type = "hardware";
};
```

### 3. Set Environment Variables

In your `.env` file:

```env
AIRPLAY_NAME=GrooveNET Audio
ENABLE_AUDIO_PLAYBACK=true
AUDIO_DEVICE=hw:1,0  # Direct hardware access
```

### 4. Start the Service

```bash
docker compose -f docker-compose.prod.yml up -d shairport-sync
```

### 5. Test AirPlay

- On your iPhone/iPad: Open Control Center → Tap AirPlay icon
- On your Mac: Click volume icon in menu bar → Select speaker
- Look for "GrooveNET Audio" in the list
- Play music and verify it comes through your USB DAC

**Done!** AirPlay is now available, but only one source can play at a time.

---

## Option 2: Software Mixing with dmix (Recommended)

This allows both AirPlay and the Next.js app to play simultaneously through your USB DAC.

### 1. Configure ALSA dmix

Edit `config/asound.conf` and update the card numbers:

```conf
# Change all instances of 'hw:1,0' to match your USB DAC card number
# Run 'aplay -l' to find your card number

pcm.dmixer {
    type dmix
    ipc_key 1024
    ipc_perm 0666

    slave {
        pcm "hw:1,0"  # ← Change this
        rate 48000
        channels 2
        format S16_LE
        period_size 1024
        buffer_size 8192
    }

    bindings {
        0 0
        1 1
    }
}
```

### 2. Enable ALSA Config in Docker Compose

Edit `docker-compose.prod.yml`:

**For the `app` service:**
```yaml
app:
  volumes:
    - music_data:/app/audio
    # ... other volumes ...
    - ./config/asound.conf:/etc/asound.conf:ro  # ← Uncomment this line
```

**For the `shairport-sync` service:**
```yaml
shairport-sync:
  image: mikebrady/shairport-sync:latest
  container_name: shairport-sync
  network_mode: host
  restart: unless-stopped
  environment:
    - AIRPLAY_NAME=${AIRPLAY_NAME:-GrooveNET Audio}
  devices:
    - /dev/snd:/dev/snd
  volumes:
    - ./config/shairport-sync.conf:/etc/shairport-sync.conf:ro
    - ./config/asound.conf:/etc/asound.conf:ro  # ← Add this line
```

### 3. Configure Shairport Sync for dmix

Edit `config/shairport-sync.conf`:

```conf
alsa = {
  // Use dmix for software mixing
  output_device = "dmix:CARD=DAC,DEV=0";

  // Or if your card name is different, use:
  // output_device = "dmixed";  // Defined in asound.conf

  mixer_control_name = "PCM";
  mixer_type = "hardware";
};
```

### 4. Update Environment Variables

In your `.env` file:

```env
AIRPLAY_NAME=GrooveNET Audio
ENABLE_AUDIO_PLAYBACK=true
AUDIO_DEVICE=dmix:CARD=DAC,DEV=0  # Use dmix instead of direct hw
```

### 5. Restart Services

```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### 6. Test Simultaneous Playback

1. Start playing music from the Next.js app (local DAC mode)
2. Open AirPlay on your iPhone and stream music to "GrooveNET Audio"
3. Both should play simultaneously, mixed together

**Done!** You now have simultaneous playback capability.

---

## Option 3: Coordinated Playback (with Hooks)

This automatically pauses the Next.js app when AirPlay starts playing.

### 1. Follow Option 1 or Option 2 Setup

Choose either direct hardware access or dmix as your base configuration.

### 2. Enable Session Control in Shairport Sync

Edit `config/shairport-sync.conf`:

```conf
sessioncontrol = {
  // Pause app playback when AirPlay starts
  run_this_before_play_begins = "/usr/local/bin/airplay-session-start.sh";

  // Optional: Resume when AirPlay ends (usually you don't want this)
  // run_this_after_play_ends = "/usr/local/bin/airplay-session-end.sh";

  wait_for_completion = "yes";
  allow_session_interruption = "yes";
  session_timeout = 120;
};
```

### 3. Mount Hook Scripts in Docker

Edit `docker-compose.prod.yml`:

```yaml
shairport-sync:
  volumes:
    - ./config/shairport-sync.conf:/etc/shairport-sync.conf:ro
    - ./scripts/airplay-session-start.sh:/usr/local/bin/airplay-session-start.sh:ro
    - ./scripts/airplay-session-end.sh:/usr/local/bin/airplay-session-end.sh:ro
  environment:
    - AIRPLAY_NAME=${AIRPLAY_NAME:-GrooveNET Audio}
    - AIRPLAY_AUTO_PAUSE=true  # ← Enable auto-pause
```

### 4. Update Environment Variables

In your `.env` file:

```env
AIRPLAY_AUTO_PAUSE=true
```

### 5. Restart Shairport Sync

```bash
docker compose -f docker-compose.prod.yml restart shairport-sync
```

### 6. Test Auto-Pause

1. Play music from the Next.js app (local DAC mode)
2. Stream AirPlay audio to "GrooveNET Audio"
3. App playback should automatically pause
4. Stop AirPlay - app stays paused (resume manually)

**Done!** AirPlay now coordinates with your app playback.

---

## Troubleshooting

### AirPlay Device Not Appearing

**Problem:** "GrooveNET Audio" doesn't show up in AirPlay menu

**Solutions:**

1. **Check network_mode is host:**
   ```yaml
   shairport-sync:
     network_mode: host  # Required for mDNS discovery
   ```

2. **Verify service is running:**
   ```bash
   docker ps | grep shairport
   docker logs shairport-sync
   ```

3. **Check firewall:**
   - AirPlay uses ports 5000 (RTSP) and 6001-6011 (UDP)
   - Allow these ports on your Intel NUC firewall

4. **Ensure devices are on same network:**
   - Your iPhone/Mac and Intel NUC must be on the same LAN
   - VLANs can block mDNS - ensure multicast is allowed

### Audio Stuttering or Dropouts

**Problem:** AirPlay audio cuts out or stutters

**Solutions:**

1. **Increase buffer size in asound.conf:**
   ```conf
   slave {
       buffer_size 16384  # Increase from 8192
       period_size 2048   # Increase from 1024
   }
   ```

2. **Use plughw instead of hw:**
   ```env
   AUDIO_DEVICE=plughw:1,0
   ```

3. **Check network quality:**
   - Use 5GHz WiFi instead of 2.4GHz
   - Use wired Ethernet for Intel NUC if possible

4. **Disable other network services temporarily:**
   - Test with minimal network load

### No Sound from AirPlay

**Problem:** AirPlay connects but no audio plays

**Solutions:**

1. **Verify ALSA device name:**
   ```bash
   docker exec shairport-sync aplay -l
   ```

2. **Check volume levels:**
   ```bash
   docker exec shairport-sync amixer -c 1 sget PCM
   docker exec shairport-sync amixer -c 1 sset PCM 100%
   ```

3. **Test direct ALSA playback:**
   ```bash
   docker exec shairport-sync speaker-test -D hw:1,0 -t wav -c 2
   ```

4. **Check shairport-sync logs:**
   ```bash
   docker logs -f shairport-sync
   ```

### Both AirPlay and App Can't Play Simultaneously (dmix not working)

**Problem:** Second source fails to play when first is already playing

**Solutions:**

1. **Verify asound.conf is mounted:**
   ```bash
   docker exec myapp cat /etc/asound.conf
   docker exec shairport-sync cat /etc/asound.conf
   ```

2. **Check dmix device in config:**
   - Shairport Sync should use: `output_device = "dmixed";`
   - App should use: `AUDIO_DEVICE=dmix:CARD=DAC,DEV=0`

3. **Verify permissions in asound.conf:**
   ```conf
   ipc_perm 0666  # Allow all users
   ```

4. **Restart both containers:**
   ```bash
   docker compose -f docker-compose.prod.yml restart app shairport-sync
   ```

### Session Hooks Not Working

**Problem:** App doesn't pause when AirPlay starts

**Solutions:**

1. **Verify scripts are executable:**
   ```bash
   ls -la scripts/airplay-session-*.sh
   chmod +x scripts/airplay-session-*.sh
   ```

2. **Check scripts are mounted:**
   ```bash
   docker exec shairport-sync ls -la /usr/local/bin/airplay-session-start.sh
   ```

3. **Test script manually:**
   ```bash
   docker exec shairport-sync /usr/local/bin/airplay-session-start.sh
   ```

4. **Check shairport-sync logs for errors:**
   ```bash
   docker logs -f shairport-sync
   ```

---

## Advanced Configuration

### Custom AirPlay Name per Device

If running multiple instances:

```env
AIRPLAY_NAME=GrooveNET Kitchen
# or
AIRPLAY_NAME=GrooveNET Living Room
```

### Higher Quality Audio Settings

For 24-bit/96kHz DACs, edit `config/asound.conf`:

```conf
slave {
    rate 96000      # Higher sample rate
    format S24_LE   # 24-bit audio
}
```

And in `config/shairport-sync.conf`:

```conf
general = {
    interpolation = "soxr";  # High-quality resampling
};
```

### Password-Protected AirPlay

Edit `config/shairport-sync.conf`:

```conf
general = {
    password = "your_password_here";
};
```

### Metadata Display

Capture AirPlay metadata (song title, artist) to display in your UI:

```conf
metadata = {
    enabled = "yes";
    pipe_name = "/tmp/shairport-sync-metadata";
    pipe_timeout = 5000;
};
```

Then read from the named pipe in your Next.js app.

---

## Performance Tuning

### Low Latency Setup

For minimal delay (DJ use):

```conf
alsa = {
    period_size = 512;   # Smaller periods
    buffer_size = 2048;  # Smaller buffer
};
```

**Note:** Lower latency increases CPU usage and risk of dropouts.

### High Stability Setup

For rock-solid playback (background music):

```conf
alsa = {
    period_size = 2048;   # Larger periods
    buffer_size = 16384;  # Larger buffer
};
```

---

## Portainer Deployment

### Via Portainer Stack Editor

1. Go to **Stacks** → Your Stack → **Editor**
2. Uncomment the `shairport-sync` service block
3. Add environment variable: `AIRPLAY_NAME=GrooveNET Audio`
4. Click **Update the stack**
5. Upload `config/shairport-sync.conf` via Portainer file browser

### Via Portainer Environment Variables

In the stack editor environment section:

```
AIRPLAY_NAME=GrooveNET Audio
AIRPLAY_AUTO_PAUSE=false
AUDIO_DEVICE=dmix:CARD=DAC,DEV=0
```

---

## Security Considerations

- **Network Exposure:** AirPlay broadcasts on your LAN - anyone on the network can stream
- **Password Protection:** Use password in config if needed
- **Firewall:** Restrict ports 5000-6011 to trusted networks only
- **Resource Limits:** Add Docker resource limits to prevent DoS

---

## Summary: Quick Start Checklist

For most users (dmix method):

- [ ] Run `./scripts/detect-audio-devices.sh` to find your USB DAC card number
- [ ] Edit `config/asound.conf` - replace all `hw:1,0` with your card number
- [ ] Edit `config/shairport-sync.conf` - set `output_device = "dmixed";`
- [ ] Uncomment `shairport-sync` service in docker-compose
- [ ] Uncomment ALSA config volume mounts for `app` and `shairport-sync`
- [ ] Set `AUDIO_DEVICE=dmix:CARD=DAC,DEV=0` in `.env`
- [ ] Set `AIRPLAY_NAME=Your Name Here` in `.env`
- [ ] Run `docker compose -f docker-compose.prod.yml up -d`
- [ ] Test from iPhone/Mac - look for your AirPlay name
- [ ] Enjoy simultaneous Next.js app and AirPlay audio!

---

## See Also

- [Local DAC Playback Guide](LOCAL_PLAYBACK.md)
- [Shairport Sync Documentation](https://github.com/mikebrady/shairport-sync)
- [ALSA dmix Plugin](https://www.alsa-project.org/wiki/Dmix)
