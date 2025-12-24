#!/bin/bash

# AirPlay Session Start Hook
# Called by shairport-sync when an AirPlay session begins
# Optional: Auto-pause the Next.js app's local playback

# Only run if auto-pause is enabled
if [ "$AIRPLAY_AUTO_PAUSE" != "true" ]; then
  exit 0
fi

# Pause local DAC playback via API
curl -s -X POST http://localhost:3000/api/playback/local \
  -H "Content-Type: application/json" \
  -d '{"action": "pause"}' \
  > /dev/null 2>&1

# Optional: Log the event
# echo "$(date): AirPlay session started, paused local playback" >> /var/log/airplay-hooks.log

exit 0
