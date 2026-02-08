#!/bin/sh
# Shairport-Sync Entrypoint Script
# Processes config template with environment variables before starting

# Process the config template with sed (more portable than envsubst)
sed "s|\${AUDIO_DEVICE}|$AUDIO_DEVICE|g" /etc/shairport-sync.conf.template > /etc/shairport-sync.conf

# Call the original s6-overlay entrypoint
exec /init
