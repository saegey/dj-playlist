#!/bin/bash

# AirPlay Session Start Hook
# Called by shairport-sync when an AirPlay session begins
# Auto-pause the Next.js app's local playback

# Only run if auto-pause is enabled
if [ "$AIRPLAY_AUTO_PAUSE" != "true" ]; then
  exit 0
fi

# Get the app URL from environment variable, default to localhost:3000
APP_URL="${APP_URL:-http://localhost:3000}"

# Since shairport-sync runs with network_mode: host, it can reach the app
# via the host's network at the published port
curl -s -X POST "${APP_URL}/api/playback/local" \
  -H "Content-Type: application/json" \
  -d '{"action": "pause"}' \
  --max-time 5 \
  > /dev/null 2>&1

# Log the event for debugging
echo "$(date): AirPlay session started, sent pause command to ${APP_URL}" >> /tmp/airplay-hooks.log

exit 0
