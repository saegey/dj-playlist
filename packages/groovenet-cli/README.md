# @groovenet/cli

Command-line interface for managing your [Groovenet](https://github.com/Public-Vinyl-Radio/groovenet) DJ collection — search tracks and albums, manage playlists and friends, and control server-side playback, all from the terminal.

## Install

```bash
npm install -g @groovenet/cli
```

Requires **Node.js ≥ 22.12**. The binary is `groovenet`.

## Configure

Point the CLI at your Groovenet API (stored in `~/.groovenet/config.json`):

```bash
groovenet config set api_base https://your-groovenet-host/api
groovenet config set api_key <token>   # if your instance requires auth
```

## Usage

```bash
groovenet tracks search "miles davis"     # search tracks
groovenet tracks search --genre latin     # Latin and every subgenre (cumbia, salsa, …)
groovenet genres similar cumbia --limit 5 # related genres, scores, and signals
groovenet albums search "kind of blue"    # browse albums
groovenet playlists list                  # list playlists
groovenet playlists log-spins 176         # log the latest performance as spins
groovenet friends list                    # manage the friends system
groovenet player start --detach           # start local headless audio playback
groovenet player                         # open the interactive player (TTY)
groovenet player --search "bpm:120"       # start the TUI with search results
groovenet player --playlist 176          # start the TUI with a playlist queued
groovenet player queue add "miles davis"  # search and queue downloaded tracks
groovenet player play                     # start or resume playback
groovenet play <track-id>                 # play a track via MPD on the server
groovenet fingerprint-library             # index reference audio for matching
groovenet sets derive set.mp3 --playlist 176  # tracklist + diff from a set recording
```

Every command accepts `--json` for machine-readable output:

```bash
groovenet tracks search "bpm:120" --json | jq '.[].track_id'
```

Run `groovenet --help` (or `groovenet <command> --help`) for the full command reference.

## Commands

| Command | Description |
| --- | --- |
| `config` | Manage CLI configuration (`api_base`, `api_key`) |
| `tracks` | Search and manage tracks |
| `albums` | Browse and manage albums |
| `playlists` | Manage playlists |
| `friends` | Manage the friends system |
| `genres` | Find similar genres and reconcile track tags onto the taxonomy |
| `fingerprint-library` | Build the reference fingerprint index used to recognise vinyl as it plays |
| `sets` | Derive a corrected tracklist from a recording of a set, and diff it against the plan |
| `player` | Start, control, and stop local headless playback through the player daemon |

### Local player

The local player uses mpv and plays downloaded audio through the configured
Groovenet API. Start it in the foreground with `groovenet player start`, or
detach it and stop it later with `groovenet player stop`:

```bash
groovenet player start --detach
groovenet player queue add "miles davis"
groovenet player play
groovenet player status --json
groovenet player queue list
groovenet player devices
groovenet player devices select <id>
groovenet player stop
```

`queue add --playlist-id <id>` adds a playlist instead of a search. The daemon
stores its pidfile and Unix socket under `~/.groovenet/player/`. `devices`
continues to list outputs; `devices list` is an explicit alias. See the
[@groovenet/player protocol document](../groovenet-player/PROTOCOL.md) for the
versioned local control protocol.

The TUI requires mpv on `PATH` and a terminal. mpv audio outputs are available
on macOS, Linux and Windows. macOS AirPlay speakers appear as CoreAudio devices;
Linux AirPlay routing depends on PipeWire RAOP support, with AirPlay 2 support
varying by receiver. Windows has no native AirPlay route. AirPlay playback adds
about two seconds of latency, so it is suitable for auditioning rather than
beatmatching. The help line in the TUI lists the keyboard shortcuts: arrows or
`j`/`k` select, Enter adds or plays, Space pauses, `n`/`p` skip, left/right seek,
`+`/`-` change volume, `/` searches, `l` opens playlists, `u` opens the queue,
`d` selects an output, `r` starts playback, and `q` quits.

### genres similar

```bash
groovenet genres similar cumbia
groovenet genres similar cumbia --limit 5 --json
```

Lists related genre names and slugs, scores, and short signals such as
`sibling, NPMI 0.42, 7 shared albums`. A missing score or signal is shown as
`-` for the API's taxonomy-sibling fallback. `--json` prints the raw
`{ genre, related }` response. Similarity uses every collection; the server
defaults to at most 20 related genres, with fewer when unavailable.

### playlists log-spins

Creates one spin per playlist entry. It uses the playlist's latest live-set
performance by default and is safe to re-run for the same performance.

```bash
groovenet playlists log-spins 176
groovenet playlists log-spins 176 --performance 12
groovenet playlists log-spins 176 --at 2026-10-01T20:00:00Z
groovenet playlists log-spins 176 --derivation <derivation-id> # matched offsets; omit tracks not played
```

### sets

Turns a recording of a set into a timestamped tracklist, and — given the
playlist you planned — shows how the night differed from the plan. The file is
hashed locally and uploaded only if the server does not already have it.

```bash
groovenet sets derive ~/sets/2026-08-15.mp3 --playlist 176
groovenet sets derive set.mp3 --live-set 12       # also attach it to the live set
groovenet sets derive set.mp3 --force             # re-run even if done before
groovenet sets show <derivation-id> --playlist 176
groovenet sets review <derivation-id> --playlist 176  # accept or skip each difference, fix the playlist
```

Example output (abridged):

```
inner-signals.mp3 — 40 plays, 87.5% of 3:04:04 identified (chromaprint 1)

  ✓ 0:00:15  0:06:44  Herbie Mann — Soul Beat Momma [1234-A1]
  ⇄ 0:12:44  0:16:58  Cuco — Lovetripper [13916746-A6]  instead of A5 Feelings
  ? 0:16:58  0:19:28  unidentified (2m30s)
  ↕ 0:48:41  0:50:56  Elia y Elizabeth — Hay Que Vivir La Vida [6279169-B4]  out of order

Against playlist 176
  32 as planned · 6 played instead · 0 not planned · 2 planned but not played
```

### fingerprint-library

Fingerprints the library's reference audio so live vinyl playback can be
recognised against it. Safe to re-run: each track's audio is hashed and skipped
when nothing has changed.

```bash
groovenet fingerprint-library                  # only tracks not yet indexed
groovenet fingerprint-library --changed        # re-check already-indexed files
groovenet fingerprint-library --all --force    # regenerate everything
groovenet fingerprint-library --track 12345-1  # one track
groovenet fingerprint-library --release 12345  # one release
groovenet fingerprint-library --no-wait        # queue it and return
```

```
Indexing missing — chromaprint 1
  3653 queued, 241 without reference audio
  ✗ 12345-2: ffmpeg exited 1: Invalid data found when processing input
  ✓ 3412 indexed   ⤼ 0 skipped   ✗ 2 failed   – 241 no audio
```

Tracks with no local audio are counted, not failed — only the part of the
library you have downloaded can be fingerprinted. Exits 1 if any track failed.

## Related

- [`@groovenet/client`](https://www.npmjs.com/package/@groovenet/client) — the typed API client this CLI is built on.

## License

MIT
