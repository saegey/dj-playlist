#!/bin/bash

# AirPlay Session End Hook
# Called by shairport-sync when an AirPlay session ends
# Optional: Resume the Next.js app's local playback

# Only run if auto-pause is enabled
if [ "$AIRPLAY_AUTO_PAUSE" != "true" ]; then
  exit 0
fi

# Note: We don't auto-resume playback here because the user might not want
# the app to start playing again automatically. Instead, we just leave it paused.
# If you want auto-resume, uncomment the curl command below:

# curl -s -X POST http://localhost:3000/api/playback/local \
#   -H "Content-Type: application/json" \
#   -d '{"action": "resume"}' \
#   > /dev/null 2>&1

# Optional: Log the event
# echo "$(date): AirPlay session ended" >> /var/log/airplay-hooks.log

exit 0
