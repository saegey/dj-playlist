# AirPlay Setup for Portainer

This guide provides easy copy-paste configurations for adding AirPlay receiver to your GrooveNET stack in Portainer.

## Option 1: Separate AirPlay Stack (Recommended for Portainer)

The easiest way is to create a **separate stack** for AirPlay in Portainer.

### Steps:

1. **In Portainer**, go to **Stacks** → **Add stack**

2. **Name**: `groovenet-airplay`

3. **Build method**: Web editor

4. **Paste this YAML**:

```yaml
services:
  shairport-sync:
    image: mikebrady/shairport-sync:latest
    container_name: shairport-sync
    network_mode: host
    restart: unless-stopped

    environment:
      - AIRPLAY_NAME=GrooveNET Audio

    devices:
      - /dev/snd:/dev/snd

    volumes:
      - /home/YOUR_USER/dj-playlist/my-collection-search/config/shairport-sync.conf:/etc/shairport-sync.conf:ro
```

5. **Update the volume path**: Replace `/home/YOUR_USER/dj-playlist` with the actual path to your project on the Intel NUC

6. **Environment variables** (optional): Add these if you want custom names:
   - Key: `AIRPLAY_NAME` / Value: `Your Custom Name`

7. **Click "Deploy the stack"**

8. **Verify**: Check **Containers** to see `shairport-sync` running

### To Enable dmix (Simultaneous Playback):

Add this additional volume mount to the YAML above:

```yaml
    volumes:
      - /home/YOUR_USER/dj-playlist/my-collection-search/config/shairport-sync.conf:/etc/shairport-sync.conf:ro
      - /home/YOUR_USER/dj-playlist/my-collection-search/config/asound.conf:/etc/asound.conf:ro
```

**Also update your main app stack** to mount the same asound.conf:

In your main GrooveNET stack editor, find the `app` service volumes section and add:

```yaml
    volumes:
      - music_data:/app/audio
      # ... other volumes ...
      - /home/YOUR_USER/dj-playlist/my-collection-search/config/asound.conf:/etc/asound.conf:ro
```

---

## Option 2: Add to Existing Stack (Copy-Paste Ready)

If you prefer to add AirPlay to your existing GrooveNET stack:

### Steps:

1. **In Portainer**, go to **Stacks** → Your GrooveNET Stack → **Editor**

2. **Scroll to the bottom** of the YAML (after the `download-worker` service, before `volumes:`)

3. **Paste this service definition**:

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
```

4. **Add environment variable** in Portainer's environment section:
   - `AIRPLAY_NAME` = `GrooveNET Audio` (or your custom name)

5. **Click "Update the stack"**

### Full Service Block (with dmix support):

```yaml
  shairport-sync:
    image: mikebrady/shairport-sync:latest
    container_name: shairport-sync
    network_mode: host
    restart: unless-stopped
    environment:
      - AIRPLAY_NAME=${AIRPLAY_NAME:-GrooveNET Audio}
      - AIRPLAY_AUTO_PAUSE=${AIRPLAY_AUTO_PAUSE:-false}
    devices:
      - /dev/snd:/dev/snd
    volumes:
      - ./config/shairport-sync.conf:/etc/shairport-sync.conf:ro
      - ./config/asound.conf:/etc/asound.conf:ro
      - ./scripts/airplay-session-start.sh:/usr/local/bin/airplay-session-start.sh:ro
      - ./scripts/airplay-session-end.sh:/usr/local/bin/airplay-session-end.sh:ro
```

---

## Option 3: Add Container Manually (GUI Method)

If you prefer using Portainer's GUI instead of YAML:

1. **In Portainer**, go to **Containers** → **Add container**

2. **Fill in these fields**:

   - **Name**: `shairport-sync`
   - **Image**: `mikebrady/shairport-sync:latest`
   - **Network**: `host` (Important!)
   - **Restart policy**: Unless stopped

3. **Environment variables** (click "Add environment variable"):
   - `AIRPLAY_NAME` = `GrooveNET Audio`

4. **Volumes** (click "Map additional volume"):
   - **Container**: `/etc/shairport-sync.conf`
   - **Host**: `/home/YOUR_USER/dj-playlist/my-collection-search/config/shairport-sync.conf`
   - **Read-only**: ✓

5. **Runtime & Resources** → **Devices**:
   - **Host path**: `/dev/snd`
   - **Container path**: `/dev/snd`

6. **Click "Deploy the container"**

---

## Verifying AirPlay is Working

### 1. Check Container Logs

In Portainer:
- Go to **Containers** → `shairport-sync` → **Logs**
- Should see: `Successful Startup` and `Ready to accept connections`

### 2. Test from iPhone/iPad

- Open **Control Center**
- Tap the **AirPlay** icon
- You should see **"GrooveNET Audio"** in the list
- Select it and play music

### 3. Test from Mac

- Click the **volume icon** in menu bar
- Select **"GrooveNET Audio"**
- Play music from any app

---

## Common Portainer Issues

### "Cannot find config file"

**Problem**: Volume mount path is wrong

**Solution**:
- Use **absolute paths** in Portainer (not relative `./`)
- Example: `/home/saegey/dj-playlist/my-collection-search/config/shairport-sync.conf`
- Find your path: SSH into your NUC and run `pwd` in the project directory

### "Network mode host not working"

**Problem**: Portainer sometimes has issues with `network_mode: host`

**Solution**:
- When adding manually via GUI, ensure "Network" dropdown is set to **host**
- Or use the CLI method below

### "Device /dev/snd not accessible"

**Problem**: Portainer user doesn't have permission

**Solution**:
- SSH into your NUC
- Run: `sudo chmod -R 666 /dev/snd/*`
- Or add your Portainer user to the `audio` group

---

## CLI Alternative (If Portainer Gives Issues)

If Portainer's web editor is problematic, use Docker CLI:

### 1. SSH into your Intel NUC

### 2. Navigate to your project:
```bash
cd ~/dj-playlist/my-collection-search
```

### 3. Deploy AirPlay stack:
```bash
docker compose -f docker-compose.airplay.yml up -d
```

### 4. Verify it's running:
```bash
docker ps | grep shairport
docker logs shairport-sync
```

### 5. To stop:
```bash
docker compose -f docker-compose.airplay.yml down
```

---

## Environment Variables Reference

Set these in Portainer's **Environment variables** section or via `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `AIRPLAY_NAME` | `GrooveNET Audio` | Name shown in AirPlay menu |
| `AIRPLAY_AUTO_PAUSE` | `false` | Auto-pause app when AirPlay starts |
| `AUDIO_DEVICE` | `default` | ALSA device (use `dmix:CARD=DAC,DEV=0` for mixing) |

---

## Advanced: Using Portainer Environment Variables

Instead of editing YAML paths, use environment variables:

### 1. In your stack, use variables:

```yaml
volumes:
  - ${PROJECT_PATH}/config/shairport-sync.conf:/etc/shairport-sync.conf:ro
```

### 2. In Portainer Environment section, add:

```
PROJECT_PATH=/home/saegey/dj-playlist/my-collection-search
AIRPLAY_NAME=GrooveNET Audio
```

This makes it easier to update paths without editing YAML.

---

## Updating Configuration

### To change AirPlay name:

**Via Portainer UI**:
1. Go to **Stacks** → `groovenet-airplay` → **Environment variables**
2. Change `AIRPLAY_NAME` value
3. Click **Update the stack**

**Via CLI**:
```bash
docker restart shairport-sync
```

### To change audio settings:

1. Edit `config/shairport-sync.conf` on your host
2. Restart container:
   - Portainer: **Containers** → `shairport-sync` → **Restart**
   - CLI: `docker restart shairport-sync`

---

## Complete Example for Portainer

Here's a complete, copy-paste ready stack for Portainer (separate stack approach):

```yaml
version: '3.8'

services:
  shairport-sync:
    image: mikebrady/shairport-sync:latest
    container_name: shairport-sync
    network_mode: host
    restart: unless-stopped

    environment:
      AIRPLAY_NAME: ${AIRPLAY_NAME:-GrooveNET Audio}

    devices:
      - /dev/snd:/dev/snd

    volumes:
      - ${PROJECT_PATH:-/home/saegey/dj-playlist/my-collection-search}/config/shairport-sync.conf:/etc/shairport-sync.conf:ro
      - ${PROJECT_PATH:-/home/saegey/dj-playlist/my-collection-search}/config/asound.conf:/etc/asound.conf:ro
```

**Environment variables to add in Portainer**:
```
PROJECT_PATH=/home/YOUR_USER/dj-playlist/my-collection-search
AIRPLAY_NAME=GrooveNET Audio
```

---

## Troubleshooting Portainer-Specific Issues

### Stack won't deploy

- **Check YAML syntax**: Use a YAML validator
- **Check paths**: Ensure absolute paths, not relative
- **Check permissions**: Portainer agent needs read access to config files

### Container starts but AirPlay not visible

- **Check network mode**: Must be `host`
- **Check firewall**: Ports 5000-6011 must be open
- **Check mDNS**: Ensure avahi-daemon is running on NUC
- **Check logs**: `docker logs shairport-sync`

### Volume mount errors

- **Use absolute paths**: `/home/user/...` not `./...`
- **Check file exists**: SSH and verify config file is there
- **Check permissions**: Config files must be readable

---

## Summary: Recommended Approach for Portainer

1. ✅ **Create separate stack** `groovenet-airplay` using Option 1
2. ✅ **Use environment variables** for paths
3. ✅ **Use absolute paths** in volume mounts
4. ✅ **Set `network_mode: host`** for AirPlay discovery
5. ✅ **Test from iPhone/Mac** after deployment

This approach keeps your main stack clean and makes AirPlay easy to enable/disable independently.
