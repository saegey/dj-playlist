# OwnTone validation (#691)

Part of [#651](https://github.com/Public-Vinyl-Radio/groovenet/issues/651).
Design review: [#688](https://github.com/Public-Vinyl-Radio/groovenet/pull/688).

## Isolated API experiment

Run from a checkout on a machine with Docker, Bash, and Node 22 or newer:

```sh
bash evaluations/691/isolated-smoke.sh
```

The script uses the official OwnTone image pinned to the OCI index digest
`sha256:6a88589edc4dd9c438da62a18a25374d3e6e01457745f241a22baf88c43c9582`.
The selected linux/arm64 image reports **OwnTone 29.3**. The index also lists a
linux/amd64 image; execution on Debian amd64 is pending. The image may need to
be downloaded before the network-isolated container starts.

Only the test configuration is mounted, read-only. The container has no
external network, published ports, audio devices, production files, or saved
credentials. It generates a two-second silent WAV and queues its loopback HTTP
URL without playing it. An EXIT trap removes the temporary container and its
writable layer; the downloaded image remains cached. No persistent volumes are
created. Run separate invocations to reproduce the experiment.

### Findings from initial manual execution (2026-10-24)

- The pinned image reports 29.3 on local OrbStack (Docker 29.8.2, linux/arm64).
- Starting only the engine fails with `mDNS init failed`. Starting its bundled
  D-Bus and Avahi first lets its HTTP API start even with external networking
  disabled. An actual deployment should use the official image entrypoint;
  this fixture bypasses it to keep initialization explicit and isolated.
- `/api/player` reports stopped with no current item. Its volume is **-1**
  with no outputs, so an adapter must handle an unknown engine volume rather
  than assume every response is within 0–100.
- `/api/outputs` returns an empty list, as expected in this fixture. This
  does not test discovery.
- Queueing unindexed `file:///tmp/fixture.wav` or `/file:/tmp/fixture.wav`
  through `POST /api/queue/items/add` returns HTTP 500. A read-only volume mount
  alone is therefore not a proven direct-file queue solution. The 29.3 source
  accepts `library:` identifiers or HTTP(S) in its filescanner queue handler.
- A loopback HTTP URL is accepted as one `data_kind: url` queue entry without
  starting playback. Initially it has unknown duration (`length_ms: 0`), so
  this does not prove seek, duration, format support during playback, or
  reliable natural-completion events.

Do not interpret API queue acceptance as successful audio decoding or AirPlay
playback. The HTTP fixture is unauthenticated: authenticated/range-capable audio
delivery remains a separate validation gate.

## Next: Debian and hardware validation

The read-only SSH attempt to `beelink` as `saegey` failed authentication.
No production deployment or receiver changes have been made. HA MCP was not
available in the current tool set. Resume live checks when access is available.

1. Inspect the Debian release, Docker architecture/version, existing services,
   occupied ports, audio mount paths, and mDNS/timing daemons. Do not dump
   rendered environment/config files containing credentials into reports.
2. Inspect live HA states and integration versions for both Pis and Sonos.
   Record whether source/session identity is available, and distinguish an
   initial default idle state from an observed receiver event.
3. Prepare one disposable instance with a fresh database and read-only audio
   access. Review its configuration before launch: official image defaults
   trust any network, so replace that default and restrict control access.
   Use an empty test library initially rather than scanning production audio.
4. Verify discovery before choosing outputs. Record speaker state and check
   that an existing session will not be interrupted before playback tests.
5. Test a representative downloaded track through authenticated HTTP delivery
   (or prove indexed read-only library mapping), including range/seek and end
   detection. Do not embed the global API key in URLs or logs.
6. Test each receiver, all three synchronized, adding/removing outputs, pause,
   seek, volume, disconnects, and external-source interruptions in both
   directions. Record observed behavior, not only intended policy.
7. Add the second isolated engine. Follow upstream multiple-instance guidance
   on identities, databases, ports, and shared airptpd timing. Test independent
   queues on disjoint outputs and explicit speaker transfer.
8. Stop and remove only the prototype services. Confirm existing playback and
   Groovenet services are unchanged. Keep production deployment separate from
   this experiment.

Record hardware results here with engine/image versions, receiver software,
network mode, commands, expected/actual behavior, and cleanup evidence. All
hardware checks are currently pending.

## Upstream references

- [Official container](https://github.com/owntone/owntone-container)
- [29.3 API](https://github.com/owntone/owntone-server/blob/29.3/docs/json-api.md)
- [29.3 file/stream queue handler](https://github.com/owntone/owntone-server/blob/29.3/src/library/filescanner.c)
- [29.3 configuration](https://github.com/owntone/owntone-server/blob/29.3/owntone.conf.in)
- [Multiple instances and airptpd](https://owntone.github.io/owntone-server/advanced/multiple-instances/)

OwnTone includes the GPL version 2 license; image build dependencies have their
own licenses. Deployment packaging/license inventory remains to be recorded.
