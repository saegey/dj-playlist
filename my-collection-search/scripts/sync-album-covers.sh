#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ] || [ "${2:-}" = "" ]; then
  echo "Usage: $0 <remote-host> <remote-volume-path> [local-dir]"
  echo "Example: $0 saegey@vinyl.local /var/lib/docker/volumes/teststack_album_covers/_data /Users/saegey/groovenet-covers"
  exit 1
fi

REMOTE_HOST="$1"
REMOTE_PATH="$2"
LOCAL_DIR="${3:-/Users/saegey/groovenet-covers}"

mkdir -p "$LOCAL_DIR"

echo "Syncing album covers from $REMOTE_HOST:$REMOTE_PATH to $LOCAL_DIR"
echo "This uses sudo on the remote host (you may be prompted for password)."

# Stream a tarball over SSH so we can read root-owned Docker volume data
ssh -t "$REMOTE_HOST" "sudo tar -C \"$REMOTE_PATH\" -cf - ." | tar -C "$LOCAL_DIR" -xf -

echo "Sync complete."
echo "Local dir: $LOCAL_DIR"
