# GrooveNET
## Vinyl collection management for DJs

![screenshot](https://raw.githubusercontent.com/saegey/dj-playlist/refs/heads/main/content/grooveNetdemo.gif)

A self-hosted, full-stack app for managing your vinyl collection. Import from Discogs, enrich metadata with Apple Music and YouTube, analyze audio for BPM/key/mood, and generate intelligent playlists — all from a web UI or terminal.

## Features

- **Powerful Search**: PostgreSQL full-text + fuzzy search with infinite scroll and advanced filtering
- **Multi-Platform Integration**: Discogs, Apple Music, YouTube, and SoundCloud
- **Audio Analysis**: Essentia-powered BPM, key detection, and mood analysis
- **Smart Playlisting**: Genetic algorithm playlist generation based on BPM, key, mood, and genre
- **Metadata Enrichment**: Bulk editing, AI-assisted completion, and track linking across platforms
- **Vector Similarity Search**: Find similar tracks using OpenAI embeddings (optional)
- **Friend Collections**: Browse and share collections with friends
- **CLI + MCP Server**: Terminal client and Claude Code integration
- **Backup / Restore**: Full database backup and restore via web UI

## Project Structure

```
dj-playlist/
├── my-collection-search/        # Main Next.js application + API
│   ├── src/
│   │   ├── app/                 # App Router pages and API routes
│   │   ├── components/          # React components
│   │   ├── server/              # Backend repositories and services
│   │   ├── types/               # TypeScript types (source of truth)
│   │   └── api-contract/        # Zod schemas shared across routes
│   ├── migrations/              # PostgreSQL migrations (node-pg-migrate)
│   └── .env.example             # Environment variable template
├── packages/
│   ├── groovenet-client/        # Shared typed API client (@groovenet/client)
│   └── groovenet-cli/           # CLI tool (npm: @groovenet/cli, bin: groovenet)
├── mcp-server/                  # MCP server for Claude Code integration
├── essentia-api/                # Python FastAPI audio analysis microservice
├── ga-service/                  # Python genetic algorithm playlist service
├── download-worker/             # Python background worker (yt-dlp, gamdl, audio downloads)
└── justfile                     # Task runner (just compose-dev, just release, etc.)
```

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose v2
- [mise](https://mise.jdx.dev/) for local toolchain setup
- [just](https://github.com/casey/just) — task runner
- A [Discogs](https://www.discogs.com) account with a collection

### Quick Start (Development)

```bash
git clone <your-repo-url>
cd dj-playlist

# Install toolchains + dependencies
mise install
just bootstrap

# Configure environment
cp my-collection-search/.env.example my-collection-search/.env
# Edit .env with your credentials

# Start all services with hot reload
just compose-dev

# In another terminal, run migrations
just migrate-up
```

App is available at [http://localhost:3000](http://localhost:3000).

After starting, navigate to the import page and click **Sync from Discogs** to load your collection.

### Local Task Shortcuts

```bash
just bootstrap      # install node/python dependencies across the repo
just test           # run app + shared package tests
just lint           # run frontend lint checks
just typecheck      # run app typecheck + package builds
```

### Production Deployment

#### Linux / x86_64 (pre-built images)

```bash
cp my-collection-search/.env.example my-collection-search/.env
# Edit .env with production credentials

docker compose -f my-collection-search/docker-compose.prod.yml up -d
docker compose -f my-collection-search/docker-compose.prod.yml run --rm migrate
```

#### Mac / ARM64 (local build)

```bash
cp my-collection-search/.env.example my-collection-search/.env
just compose-dev  # or omit -dev for production mode
just migrate-up
```

Pre-built images are x86_64 only. Mac users build locally from source.

#### Remote deploy (via SSH)

```bash
just release-localbuild   # tag + deploy to beelink.tail0bdbb0.ts.net (builds on server)
just release              # tag + push images to registry + deploy
```

Set `PROD_HOST` and `PROD_STACK_DIR` in your environment or justfile to match your server.

## Environment Variables

Copy `.env.example` to `.env` and fill in the values. All platform integrations are optional except Discogs.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | ✅ | DB credentials |
| `DISCOGS_USER_TOKEN` | ✅ | API token from discogs.com/settings/developers |
| `DISCOGS_USERNAME` | ✅ | Your Discogs username |
| `DISCOGS_FOLDER_ID` | ✅ | `0` for all folders |
| `APPLE_MUSIC_TEAM_ID` | — | 10-char team ID from Apple Developer account |
| `APPLE_MUSIC_KEY_ID` | — | 10-char MusicKit key ID |
| `APPLE_MUSIC_PRIVATE_KEY` | — | Contents of your `.p8` key file (paste with real newlines) |
| `YOUTUBE_API_KEY` | — | YouTube Data API v3 key |
| `OPENAI_API_KEY` | — | Required for AI metadata and vector search features |
| `NEXT_PUBLIC_POSTHOG_KEY` | — | PostHog analytics (optional) |
| `RESTIC_REPOSITORY` / `RESTIC_PASSWORD` | — | Remote backup via restic + Backblaze B2 |

For Apple Music, paste the full contents of your `.p8` file as the `APPLE_MUSIC_PRIVATE_KEY` value (with real newlines, not `\n` literals).

## Database Migrations

Migrations are managed with [node-pg-migrate](https://github.com/salsita/node-pg-migrate). Files live in `my-collection-search/migrations/`.

```bash
just migrate-up              # run pending migrations
just migrate-down            # roll back last migration
just migrate-create NAME=foo # create a new migration file
```

## Backup & Restore

- **Backup**: Web UI → Settings → Backup, or `POST /api/backup`
- **Restore**: Web UI → Settings → Restore (upload a `.sql` dump)

Backups are SQL dumps stored in the `db_dumps` volume. The restore process drops and recreates the schema, then re-imports data.

## CLI (`groovenet`)

A terminal client for your collection — useful over Tailscale or SSH from any machine.

### Install

```bash
npm install -g @groovenet/cli
```

Or from source:

```bash
npm install && just build-packages
cd packages/groovenet-cli && npm link
```

### Configure

```bash
groovenet config set api_base http://groovenet.local:3000/api
groovenet config show
```

### Commands

```bash
# Tracks
groovenet tracks search "acid house" --bpm-min 120 --bpm-max 135
groovenet tracks show <track-id>
groovenet tracks update <track-id> --rating 5 --tags "acid,classic"

# Albums
groovenet albums list
groovenet albums show <release-id>
groovenet albums download <release-id>

# Playlists
groovenet playlists list
groovenet playlists show <id>
groovenet playlists create "Friday Night"
groovenet playlists generate <id>

# Playback
groovenet play <track-id>
groovenet pause
groovenet stop
groovenet now-playing

# Friends
groovenet friends list
groovenet friends add <username>
```

All commands support `--json` for scripting.

## MCP Server (Claude Code)

Allows Claude to browse and manage your collection through natural language.

### Setup

```bash
npm install && just build-packages

claude mcp add --transport stdio --scope project groovenet \
  -- node /path/to/dj-playlist/mcp-server/build/index.js
```

For remote access (e.g. over Tailscale):

```bash
claude mcp add --transport stdio --scope user groovenet \
  -- env API_BASE=http://groovenet.local:3000/api \
     node /path/to/dj-playlist/mcp-server/build/index.js
```

### Available Tools

| Category | Tools |
|---|---|
| Tracks | `search_tracks`, `get_track_details`, `update_track`, `get_missing_apple_music` |
| Albums | `search_albums`, `get_album`, `update_album`, `download_album` |
| Playlists | `list_playlists`, `get_playlist`, `create_playlist`, `generate_ai_playlist` |
| Friends | `get_friends`, `add_friend` |
| External | `search_apple_music`, `search_youtube` |

See [`mcp-server/README.md`](mcp-server/README.md) for full documentation.

## Technology Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Chakra UI v3, TanStack Query v5, Zustand |
| Backend | Next.js API Routes, PostgreSQL 15 + pgvector, Redis, node-pg-migrate |
| Audio analysis | Python FastAPI + Essentia |
| Playlist generation | Python FastAPI + genetic algorithm |
| Download worker | Python + yt-dlp + gamdl |
| Package management | npm workspaces (JS), uv (Python) |
| External APIs | Discogs, Apple Music, YouTube, OpenAI |

## Troubleshooting

**Database connection issues**
```bash
docker compose logs db
docker compose exec db psql -U djplaylist -d djplaylist -c "SELECT 1;"
```

**Migrations out of sync** (schema exists but pgmigrations table is empty)
```bash
# Connect to the DB and manually insert the migration records
docker compose exec db psql -U djplaylist djplaylist
```
Then insert rows into `pgmigrations` for each migration that has already been applied.

**Audio analysis failing**
```bash
docker compose logs essentia-api
curl http://localhost:8001/health
```

**Port conflicts** — modify `ports:` in `docker-compose.yml` (e.g. `"3001:3000"`)

## Contributing

- TypeScript strict mode throughout
- Use `queryKeys.ts` helpers — don't build query keys by hand
- Add migrations for all schema changes
- When adding API endpoints: add to `groovenet-client`, then wire into CLI and/or MCP server
- Build order: `just build-packages` (client → cli → mcp-server)

## License

MIT
