#!/usr/bin/env bash
# Debian discovery experiment; optional explicit Lounge-only audio smoke test.
# Usage: bash discover.sh LAN_INTERFACE [--play-lounge]
set -euo pipefail
umask 077

[[ "$(uname -s)" == Linux ]]
lan_interface="${1:?Supply the LAN interface, e.g. enp170s0}"
fixture_mode="${2:-discover}"
[[ "$fixture_mode" == discover || "$fixture_mode" == --play-lounge ]]
[[ "$lan_interface" =~ ^[a-zA-Z0-9_.:-]+$ ]]
ip link show "$lan_interface" >/dev/null
if ss -H -ltn 'sport = :13689' | grep -q .; then
  echo 'Port 13689 is already occupied; refusing to reuse an existing service.' >&2
  exit 1
fi

fixture_name="groovenet-691-discovery-$$"
fixture_dir="$(mktemp -d /tmp/groovenet-691.XXXXXX)"
fixture_image='docker.io/owntone/owntone@sha256:6a88589edc4dd9c438da62a18a25374d3e6e01457745f241a22baf88c43c9582'
lan_address="$(ip -4 -o addr show "$lan_interface" | awk '{print $4}' | cut -d/ -f1 | head -n1)"
[[ -n "$lan_address" ]]
cleanup() {
  fixture_status=$?
  if [[ "$fixture_status" != 0 ]]; then
    docker logs --tail 60 "$fixture_name" >&2 || true
  fi
  if [[ "$fixture_mode" == --play-lounge ]]; then
    docker exec "$fixture_name" curl -fsS --max-time 5 -X PUT \
      http://127.0.0.1:13689/api/player/stop >/dev/null 2>&1 || true
    docker exec "$fixture_name" curl -fsS --max-time 5 -X PUT \
      -H 'Content-Type: application/json' --data '{"outputs":[]}' \
      http://127.0.0.1:13689/api/outputs/set >/dev/null 2>&1 || true
  fi
  docker rm -f "$fixture_name" >/dev/null 2>&1 || true
  rm -f "$fixture_dir/owntone.conf" "$fixture_dir/avahi-daemon.conf"
  rmdir "$fixture_dir"
}
trap cleanup EXIT

cat > "$fixture_dir/owntone.conf" <<'CONF'
general {
  uid = "nobody"
  db_path = "/tmp/owntone/library.db"
  cache_dir = "/tmp/owntone"
  logfile = "/dev/stderr"
  loglevel = log
  trusted_networks = { "localhost" }
  speaker_autoselect = no
}
library {
  name = "Groovenet discovery 691"
  port = 13689
  directories = { "/tmp/media" }
}
audio {
  type = "disabled"
}
mpd {
  port = 0
}
CONF
# bind_address also restricts the mDNS interface: loopback prevents LAN discovery.
# Permit discovery while protecting non-loopback control requests with a fresh,
# disposable password. Local API requests use trusted_networks = localhost.
fixture_password="$(cat /proc/sys/kernel/random/uuid)"
sed -i "/uid =/a\  admin_password = \"$fixture_password\"" "$fixture_dir/owntone.conf"
cat > "$fixture_dir/avahi-daemon.conf" <<CONF
[server]
allow-interfaces=$lan_interface
[publish]
disable-publishing=yes
CONF

docker run -d --name "$fixture_name" --network host \
  --mount "type=bind,src=$fixture_dir/owntone.conf,dst=/tmp/discovery.conf,readonly" \
  --mount "type=bind,src=$fixture_dir/avahi-daemon.conf,dst=/etc/avahi/avahi-daemon.conf,readonly" \
  --entrypoint /bin/sh "$fixture_image" -ec '
    mkdir -p /tmp/owntone /tmp/media /run/dbus
    chown nobody /tmp/owntone /tmp/media
    dbus-uuidgen --ensure
    dbus-daemon --system --fork
    avahi-daemon --daemonize --no-drop-root
    exec /usr/sbin/owntone -f -c /tmp/discovery.conf
  ' >/dev/null

ready=false
for ((attempt = 0; attempt < 50; attempt++)); do
  if docker exec "$fixture_name" curl -fsS --max-time 2 \
    http://127.0.0.1:13689/api/player >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 0.2
done
if [[ "$ready" != true ]]; then
  docker logs --tail 40 "$fixture_name" >&2
  exit 1
fi

lan_status="$(docker exec "$fixture_name" curl --silent --show-error --max-time 5 \
  --output /dev/null --write-out '%{http_code}' \
  "http://$lan_address:13689/api/player")"
if [[ "$lan_status" != 401 ]]; then
  echo "Expected LAN API authentication challenge, got HTTP $lan_status" >&2
  exit 1
fi

# Give multicast discovery time to resolve receivers. No output is selected.
sleep 15
docker exec "$fixture_name" /usr/sbin/owntone -v
docker exec "$fixture_name" curl -fsS --max-time 5 \
  http://127.0.0.1:13689/api/outputs | python3 -c '
import json, sys
result = json.load(sys.stdin)
assert all(not output["selected"] for output in result["outputs"]), "Unexpected selected output"
print(json.dumps(result, indent=2))
'
docker exec "$fixture_name" curl -fsS --max-time 5 \
  http://127.0.0.1:13689/api/player | python3 -c '
import json, sys
result = json.load(sys.stdin)
assert result["state"] == "stop", "Unexpected playback"
print(json.dumps(result, indent=2))
'
echo 'PASS: discovery inspected; no outputs selected and playback stopped'

if [[ "$fixture_mode" != --play-lounge ]]; then
  exit 0
fi

# Operator must check room/session occupancy before opting into this mode.
# Generate a 20-second 440 Hz tone, peak approximately -30 dBFS. Attenuate PCM
# itself because this receiver is configured to ignore AirPlay volume commands.
api() {
  docker exec "$fixture_name" curl -fsS --max-time 10 "$@"
}
api http://127.0.0.1:13689/api/outputs/202481586338774 | python3 -c '
import json, sys
output = json.load(sys.stdin)
assert output["name"] == "Lounge Room Audio"
assert output["type"] == "AirPlay 2"
assert not output["selected"]
'
docker exec "$fixture_name" ffmpeg -hide_banner -loglevel error \
  -f lavfi -i sine=frequency=440:sample_rate=44100:duration=20 \
  -af 'volume=0.25,afade=t=in:d=0.2,afade=t=out:st=19.8:d=0.2' \
  -ac 2 -metadata title=Groovenet-691-test \
  /tmp/media/groovenet-691-test.wav

fixture_uri=''
for ((attempt = 0; attempt < 30; attempt++)); do
  fixture_uri="$(api 'http://127.0.0.1:13689/api/search?query=Groovenet-691-test&type=tracks' | python3 -c '
import json, sys
items = json.load(sys.stdin).get("tracks", {}).get("items", [])
print(items[0]["uri"] if items else "")
')"
  [[ -n "$fixture_uri" ]] && break
  sleep 0.5
done
[[ "$fixture_uri" == library:track:* ]]
api -X POST --get --data-urlencode "uris=$fixture_uri" \
  http://127.0.0.1:13689/api/queue/items/add | python3 -m json.tool
api -X PUT -H 'Content-Type: application/json' --data '{"volume":5}' \
  http://127.0.0.1:13689/api/outputs/202481586338774
api -X PUT -H 'Content-Type: application/json' \
  --data '{"outputs":["202481586338774"]}' \
  http://127.0.0.1:13689/api/outputs/set
api -X PUT http://127.0.0.1:13689/api/player/play
echo 'Lounge tone started; observing engine state'
sleep 8
api http://127.0.0.1:13689/api/player | python3 -c '
import json, sys
state = json.load(sys.stdin)
print(json.dumps(state, indent=2))
assert state["state"] == "play", "Engine did not remain playing"
assert state["item_length_ms"] > 0, "Indexed fixture has no duration"
'
api -X PUT http://127.0.0.1:13689/api/player/pause
api http://127.0.0.1:13689/api/player | python3 -c '
import json, sys
state = json.load(sys.stdin)
print(json.dumps(state, indent=2))
assert state["state"] == "pause"
'
sleep 2
api -X PUT 'http://127.0.0.1:13689/api/player/seek?position_ms=14000'
api -X PUT http://127.0.0.1:13689/api/player/play
sleep 10
api http://127.0.0.1:13689/api/player | python3 -c '
import json, sys
state = json.load(sys.stdin)
print(json.dumps(state, indent=2))
assert state["state"] == "stop", "Fixture did not finish naturally"
'
echo 'PASS: Lounge engine play, pause, seek command, resume, and natural stop; audible confirmation required'
