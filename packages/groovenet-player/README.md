# @groovenet/player

UI-free playback core for the Groovenet collection player. It keeps queue and
playback state independent of a terminal interface and exposes a replaceable
`PlaybackBackend`; `MpvBackend` is the first backend and communicates with a
locally installed `mpv` process over its JSON IPC socket.

```ts
import { GroovenetClient, loadConfig } from "@groovenet/client";
import { MpvBackend, PlayerCore, TrackResolver } from "@groovenet/player";

const config = loadConfig();
const client = new GroovenetClient({
  baseUrl: config.api_base,
  apiKey: config.api_key,
  insecureTls: config.insecure_tls,
  clientName: "cli",
});
const resolver = new TrackResolver(client, { apiBase: config.api_base, apiKey: config.api_key });
const player = new PlayerCore(
  new MpvBackend({ insecureTls: config.insecure_tls }),
  resolver
);
await player.enqueueSearch("Cumbia");
// Or enqueue a playlist in its saved order:
// await player.enqueuePlaylist(42);
await player.play();
```

The resolver turns `local_audio_url` into the server's range-capable
`/api/audio?filename=…` endpoint and passes the configured bearer key to mpv.
Tracks without downloaded audio are skipped with a typed `NO_AUDIO` error.
`insecureTls` is forwarded as mpv's `--tls-verify=no` setting for installations
using a self-signed server certificate.

By default mpv is started with `--vid=no`, so embedded cover art does not open
a window (the player has no artwork view, and the daemon may have no display).
Pass `artwork: true` to `MpvBackend` to keep mpv's cover-art window. The
Groovenet CLI exposes this as the `player_artwork` config key and the
`--artwork` flag; a running daemon must be restarted to pick up a change.

`MpvBackend` does not install mpv. Install it separately and make it available
on `PATH`, or pass an executable path in the constructor. `close()` stops the
owned process. The `TestPlaybackBackend` from `@groovenet/player/testing` is a small in-memory
implementation for consumers that need to exercise the core without audio.

`defaultPlayerPaths()` returns the daemon's socket and pidfile paths (`~/.groovenet/player/`), shared by the CLI and the MCP server.

Build with `npm run build --workspace=@groovenet/player` after building
`@groovenet/client`.
