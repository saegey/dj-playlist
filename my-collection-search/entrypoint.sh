#!/bin/sh
set -e

for dir in /app/dumps /app/audio /app/cookies /app/discogs_exports /app/essentia-data /app/public/uploads/album-covers; do
  if [ -d "$dir" ]; then
    chown nextjs:nodejs "$dir" 2>/dev/null || true
  fi
done

exec gosu nextjs "$@"
