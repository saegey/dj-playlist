#!/bin/sh
set -e

# In dev, the host checkout is bind-mounted over /app. On Linux it keeps the
# host user's uid, which nextjs (1001) cannot write to, so `npm ci` dies on
# package-lock.json. Adopt the checkout owner's uid/gid instead. A no-op in the
# production image, where /app is already owned by nextjs.
app_uid=$(stat -c %u /app)
app_gid=$(stat -c %g /app)
if [ "$app_uid" != 0 ] && [ "$app_uid" != "$(id -u nextjs)" ]; then
  groupmod -o -g "$app_gid" nodejs
  usermod -o -u "$app_uid" -g "$app_gid" nextjs
fi
# The dev node_modules volume was seeded under the old uid; re-own it once.
if [ -d /app/node_modules ] && [ "$(stat -c %u /app/node_modules)" != "$(id -u nextjs)" ]; then
  chown -R nextjs:nodejs /app/node_modules
fi

# Mounted volumes/bind-mounts don't inherit the image's ownership, so the app
# (running as nextjs) can't write to them. Fix ownership at startup, then drop
# privileges. Recurse on small metadata dirs (may contain root-owned files from
# older images); only touch the top level of large media dirs to keep startup fast.
RECURSIVE_DIRS="/app/dumps /app/discogs_exports /app/cookies /app/essentia-data"
TOPLEVEL_DIRS="/app/audio /app/audio-ingest /app/set-recordings /app/public/uploads/album-covers"

for dir in $RECURSIVE_DIRS; do
  [ -d "$dir" ] && chown -R nextjs:nodejs "$dir" 2>/dev/null || true
done

for dir in $TOPLEVEL_DIRS; do
  [ -d "$dir" ] && chown nextjs:nodejs "$dir" 2>/dev/null || true
done

# Next's generated standalone server.js calls process.chdir(__dirname) as one
# of its first statements, moving the running process into the directory
# outputFileTracingRoot nests it under (my-collection-search/, because
# next.config.mjs points tracing at the monorepo root) — not this image's
# WORKDIR. App code that resolves a path off process.cwd() (cookies, dumps,
# discogs_exports, audio, audio-ingest, essentia-data,
# public/uploads/album-covers — see cookieUtils.ts, backupRunnerService.ts,
# albumArtworkService.ts and friends) only finds these volumes if a link to
# each one exists in *that* directory, not WORKDIR. A link placed here at
# build time landed one level too shallow for the real server to ever see —
# found via a missing album cover 404ing despite the file existing on the
# mounted volume. maxdepth 2 is server.js's actual depth under WORKDIR
# (anything in its node_modules — which contains its own server.js files —
# sits much deeper), so this only ever matches the real one; a dev container
# with no standalone build just skips this, process.cwd() there is already
# the bind-mounted checkout.
app_dir="$(dirname "$(find /app/my-collection-search -maxdepth 2 -name server.js 2>/dev/null | head -n1)")"
if [ -n "$app_dir" ] && [ -d "$app_dir" ]; then
  mkdir -p "$app_dir/public/uploads"
  for name in cookies dumps discogs_exports audio audio-ingest essentia-data; do
    rm -rf "${app_dir:?}/$name"
    ln -sfn "/app/$name" "$app_dir/$name"
  done
  rm -rf "${app_dir:?}/public/uploads/album-covers"
  ln -sfn /app/public/uploads/album-covers "$app_dir/public/uploads/album-covers"
fi

exec gosu nextjs "$@"
