#!/usr/bin/env bash
# API experiment only: no network, speakers, production data, or playback.
set -euo pipefail

fixture_dir="$(cd "$(dirname "$0")" && pwd)"
fixture_name="groovenet-691-smoke-$$"
fixture_image='docker.io/owntone/owntone@sha256:6a88589edc4dd9c438da62a18a25374d3e6e01457745f241a22baf88c43c9582'

cleanup() {
  docker rm -f "$fixture_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run -d --name "$fixture_name" --network none \
  --mount "type=bind,src=$fixture_dir/isolated.conf,dst=/tmp/isolated.conf,readonly" \
  --entrypoint /bin/sh "$fixture_image" -ec '
    mkdir -p /tmp/owntone /tmp/media /run/dbus
    chown nobody /tmp/owntone /tmp/media
    dbus-uuidgen --ensure
    dbus-daemon --system --fork
    avahi-daemon --daemonize --no-drop-root
    exec /usr/sbin/owntone -f -c /tmp/isolated.conf
  ' >/dev/null

api() {
  docker exec "$fixture_name" curl --fail --silent --show-error --max-time 10 "$@"
}

ready=false
for ((attempt = 0; attempt < 50; attempt++)); do
  if api http://127.0.0.1:13689/api/player >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 0.2
done
if [[ "$ready" != true ]]; then
  docker logs --tail 40 "$fixture_name" >&2
  exit 1
fi

docker exec "$fixture_name" /usr/sbin/owntone -v
api http://127.0.0.1:13689/api/player | python3 -c '
import json, sys
assert json.load(sys.stdin)["state"] == "stop"
'
api http://127.0.0.1:13689/api/outputs | python3 -c '
import json, sys
assert json.load(sys.stdin)["outputs"] == []
'

docker exec "$fixture_name" ffmpeg -hide_banner -loglevel error \
  -f lavfi -i anullsrc=r=44100:cl=stereo -t 2 /tmp/fixture.wav

# A readable but unindexed file URI is not accepted by this queue endpoint.
file_status="$(docker exec "$fixture_name" curl --silent --show-error --max-time 10 \
  --output /dev/null --write-out '%{http_code}' -X POST --get \
  --data-urlencode 'uris=file:///tmp/fixture.wav' \
  http://127.0.0.1:13689/api/queue/items/add)"
[[ "$file_status" == 500 ]]

docker exec -d "$fixture_name" busybox httpd -f -p 127.0.0.1:18080 -h /tmp
api -X POST --get --data-urlencode 'uris=http://127.0.0.1:18080/fixture.wav' \
  http://127.0.0.1:13689/api/queue/items/add | python3 -c '
import json, sys
result = json.load(sys.stdin)
assert result["count"] == 1
assert result["items"][0]["data_kind"] == "url"
'

# Adding a URL must not implicitly start playback.
api http://127.0.0.1:13689/api/player | python3 -c '
import json, sys
assert json.load(sys.stdin)["state"] == "stop"
'
echo 'PASS: stopped state, no outputs, unindexed file rejection, HTTP queue add, no autoplay'
