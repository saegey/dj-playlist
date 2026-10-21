# mcp-server

Exposes the collection to Claude Code over the Model Context Protocol. A thin
adapter — all HTTP work goes through `@groovenet/client`, with no bespoke calls.

## Configuration

Environment only; it runs as a daemon and does **not** read
`~/.groovenet/config.json` the way the CLI does.

| | |
| --- | --- |
| `API_BASE` | required |
| `API_KEY` | optional |
| `DEFAULT_FRIEND_ID` | optional |
| `SENTRY_DSN` | optional; enables exception reporting |
| `SENTRY_RELEASE` | optional; release label (defaults to the root package version) |

Register it:

```bash
claude mcp add --transport stdio --scope project groovenet \
  -- node /path/to/mcp-server/build/index.js
```

## Tools

Tools, grouped:

- **tracks** — `search_tracks`, `get_track_details`, `update_track`,
  `get_missing_apple_music`
- **albums** — `search_albums`, `get_album`, `update_album`, `download_album`
- **playlists** — `list_playlists`, `get_playlist`, `get_playlist_tracks`,
  `check_playlist`, `create_playlist`, `generate_ai_playlist`
- **friends** — `get_friends`, `add_friend`
- **discovery** — `get_recommendations`, `find_similar_identity`,
  `find_similar_vibe`, `get_similar_genres`
- **external** — `search_apple_music`, `search_youtube`
- **records** — `log_record_action`, `list_record_care`,
  `get_record_care_summary`, `get_record_copies` (with history),
  `void_record_action`

## Build

```bash
just build-packages     # client → cli → mcp-server, in that order
```

The client must be built first; this package imports its compiled output.

## Gotchas

- ESLint uses the shared Node config in the repository root; CI and pre-commit
  both cover this package.
- Tool descriptions are what the model sees. Treat them as part of the
  interface, not as comments.
