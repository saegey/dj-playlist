#!/usr/bin/env bash
# Rsyncs album covers from beelink for local dev.
# Audio is served via NFS mount (see `just mount-music`).
# Requires passwordless sudo for rsync on beelink:
#   echo 'saegey ALL=(ALL) NOPASSWD: /usr/bin/rsync' | sudo tee /etc/sudoers.d/rsync-saegey
set -euo pipefail

BEELINK_HOST="${BEELINK_HOST:-saegey@100.117.118.15}"
COVERS_LOCAL_DIR="${COVERS_LOCAL_DIR:-/Users/saegey/groovenet-covers}"

mkdir -p "$COVERS_LOCAL_DIR"

echo "→ Syncing album covers from $BEELINK_HOST..."
rsync -avz --rsync-path='sudo rsync' \
  "$BEELINK_HOST":/var/lib/docker/volumes/teststack_album_covers/_data/ \
  "$COVERS_LOCAL_DIR/"

echo "✓ Covers sync complete."
