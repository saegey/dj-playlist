#!/bin/sh
# Shairport-Sync Entrypoint Script
# Processes config template with environment variables before starting

# Process the config template with sed (more portable than envsubst).
# Supports both template and static config modes:
# - If /etc/shairport-sync.conf.template exists, render to /etc/shairport-sync.conf
# - Else if /etc/shairport-sync.conf exists and contains ${AUDIO_DEVICE}, replace in-place
if [ -f /etc/shairport-sync.conf.template ]; then
  sed "s|\${AUDIO_DEVICE}|$AUDIO_DEVICE|g" /etc/shairport-sync.conf.template > /etc/shairport-sync.conf
elif [ -f /etc/shairport-sync.conf ]; then
  if grep -q "\${AUDIO_DEVICE}" /etc/shairport-sync.conf; then
    sed "s|\${AUDIO_DEVICE}|$AUDIO_DEVICE|g" /etc/shairport-sync.conf > /etc/shairport-sync.conf.tmp
    mv /etc/shairport-sync.conf.tmp /etc/shairport-sync.conf
  fi
fi

# Call the original s6-overlay entrypoint
exec /init
