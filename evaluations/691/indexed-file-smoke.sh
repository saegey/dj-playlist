#!/usr/bin/env bash
# Read-only library delivery experiment. No network, outputs, or playback.
# Usage: bash indexed-file-smoke.sh EXISTING_VOLUME AUDIO_BASENAME
set -euo pipefail

fixture_dir="$(cd "$(dirname "$0")" && pwd)"
audio_volume="${1:?Supply an existing Docker audio volume}"
audio_basename="${2:?Supply one audio file basename}"
[[ "$audio_volume" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]]
[[ "$audio_basename" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*\.(m4a|mp3|flac|wav|ogg)$ ]]
audio_root="$(docker volume inspect "$audio_volume" --format '{{.Mountpoint}}')"
fixture_name="groovenet-691-index-$$"
fixture_image='docker.io/owntone/owntone@sha256:6a88589edc4dd9c438da62a18a25374d3e6e01457745f241a22baf88c43c9582'
cleanup() {
  docker rm -f "$fixture_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run -d --name "$fixture_name" --network none \
  --mount "type=bind,src=$fixture_dir/isolated.conf,dst=/tmp/isolated.conf,readonly" \
  --mount "type=bind,src=$audio_root/$audio_basename,dst=/tmp/media/$audio_basename,readonly" \
  --entrypoint /bin/sh "$fixture_image" -ec '
    mkdir -p /tmp/owntone /tmp/media /run/dbus
    chown nobody /tmp/owntone /tmp/media
    dbus-uuidgen --ensure
    dbus-daemon --system --fork
    avahi-daemon --daemonize --no-drop-root
    exec /usr/sbin/owntone -f -c /tmp/isolated.conf
  ' >/dev/null

api() {
  docker exec "$fixture_name" curl -fsS --max-time 10 "$@"
}
fixture_track=''
for ((attempt = 0; attempt < 50; attempt++)); do
  if fixture_track="$(api 'http://127.0.0.1:13689/api/search?type=tracks&expression=media_kind%20is%20music' 2>/dev/null | python3 -c '
import json, sys
items = json.load(sys.stdin)["tracks"]["items"]
assert len(items) == 1
print(json.dumps(items[0]))
' 2>/dev/null)"; then
    break
  fi
  fixture_track=''
  sleep 0.2
done
if [[ -z "$fixture_track" ]]; then
  docker logs --tail 40 "$fixture_name" >&2 || true
  exit 1
fi
fixture_uri="$(printf '%s' "$fixture_track" | python3 -c '
import json, sys
track = json.load(sys.stdin)
assert track["length_ms"] > 0
assert track["data_kind"] == "file"
assert track["uri"].startswith("library:track:")
print(track["uri"])
')"
api -X POST --get --data-urlencode "uris=$fixture_uri" \
  http://127.0.0.1:13689/api/queue/items/add | python3 -c '
import json, sys
result = json.load(sys.stdin)
assert result["count"] == 1
track = result["items"][0]
assert track["data_kind"] == "file"
assert track["length_ms"] > 0
fields = ("uri", "length_ms", "data_kind", "type", "samplerate", "channels")
print(json.dumps({key: track.get(key) for key in fields}, indent=2))
'
api http://127.0.0.1:13689/api/player | python3 -c '
import json, sys
assert json.load(sys.stdin)["state"] == "stop"
'
api http://127.0.0.1:13689/api/outputs | python3 -c '
import json, sys
assert json.load(sys.stdin)["outputs"] == []
'
docker exec "$fixture_name" ffmpeg -nostdin -hide_banner -loglevel error \
  -i "/tmp/media/$audio_basename" -t 5 -f null -
echo 'PASS: one read-only audio file indexed, queued and decoded; no network, outputs, or playback'
