# Groovenet MCP Server

Model Context Protocol (MCP) server for the Groovenet DJ Playlist System. Allows Claude to interact with your music collection through natural language.

Uses the shared [`@groovenet/client`](../packages/groovenet-client) typed API client.

## Tools

### Tracks
| Tool | Description |
|---|---|
| `search_tracks` | Search by title, artist, genre, BPM, key, or rating |
| `get_track_details` | Full track info including audio analysis and mood scores |
| `update_track` | Update rating, notes, tags, or platform URLs |
| `get_missing_apple_music` | Find tracks without Apple Music URLs |

### Albums
| Tool | Description |
|---|---|
| `search_albums` | Search/list albums (sort by date, year, title, rating) |
| `get_album` | Album details + full track list |
| `update_album` | Update rating, notes, condition, purchase price, library ID |
| `download_album` | Queue all missing tracks for download |

### Playlists
| Tool | Description |
|---|---|
| `list_playlists` | List all playlists |
| `get_playlist` | Playlist tracks with full metadata |
| `create_playlist` | Create a new playlist |
| `generate_ai_playlist` | Optimized DJ playlist via genetic algorithm |
| `get_playlist_tracks` | Raw track IDs for a playlist |

### Friends
| Tool | Description |
|---|---|
| `get_friends` | List friends and their IDs |
| `add_friend` | Add a friend by username |

### External Search
| Tool | Description |
|---|---|
| `search_apple_music` | Search Apple Music by title/artist/album/ISRC |
| `search_youtube` | Search YouTube Music by title/artist |

## Setup

From the repo root, install all workspace dependencies and build:

```bash
npm install
make build-packages
```

Or build only the MCP server:

```bash
npm run build --workspace=mcp-server
```

Configure the API URL (create `mcp-server/.env`):

```
API_BASE=http://localhost:3000/api
# API_KEY=your-key-if-needed
```

## Usage with Claude Code

```bash
claude mcp add --transport stdio --scope project groovenet \
  -- node /path/to/dj-playlist/mcp-server/build/index.js
```

For remote access over Tailscale, set `API_BASE` to point at your server:

```bash
claude mcp add --transport stdio --scope user groovenet \
  -- env API_BASE=http://groovenet.tail1234.ts.net/api \
     node /path/to/dj-playlist/mcp-server/build/index.js
```

Verify:
```bash
claude mcp list
```

## Example Queries

- "Search for techno tracks between 128-132 BPM in A minor"
- "Show me my highest rated albums"
- "What albums were added most recently?"
- "Download all missing tracks for album 1234567"
- "Create a playlist called 'Deep House Sunday' with my top rated tracks"
- "Generate an AI playlist starting with these tracks"
- "What tracks am I missing Apple Music URLs for?"
- "Search Apple Music for 'Plastikman - Spastik'"

## Architecture

```
Claude Code → MCP Server → @groovenet/client → Next.js API → PostgreSQL / MeiliSearch
```

All tools delegate to `GroovenetClient` methods — no API logic is duplicated in the MCP server.

## Adding New Tools

1. Add the method to `packages/groovenet-client/src/client.ts`
2. Rebuild the client: `npm run build --workspace=packages/groovenet-client`
3. Add the tool definition and handler case in `mcp-server/src/index.ts`
4. Rebuild: `npm run build --workspace=mcp-server`

## License

MIT
