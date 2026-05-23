# DJ Playlist Project Memory

## Key Architectural Decision (2026-03-01)
Separated backend/frontend code into distinct directories:
- `src/server/repositories/` — all *Repository.ts files (DB access via pg)
- `src/server/services/` — all backend *Service.ts files (Redis, Meili, external APIs)
- `src/services/` — frontend-only: `http.ts`, `aiService.ts`, `backupService.ts`, `internalApi/`

**Rule**: React components/hooks should only import from `@/services/` (never `@/server/`).

## Import Path Aliases
- Backend repos: `@/server/repositories/trackRepository`
- Backend services: `@/server/services/meiliDocumentService`
- Frontend services: `@/services/http`, `@/services/aiService`
- Scripts use relative paths: `../server/services/...`

## Scripts Directory
`src/scripts/` uses relative imports (not `@/` aliases):
- `backfill-essentia.ts` → `../server/services/trackOpsService`
- `backfill-identity.ts` → `../server/repositories/embeddingsRepository`

## Workspace Structure (2026-03-01)
npm workspaces set up at root `dj-playlist/package.json`:
- `packages/groovenet-client` — shared typed API client (`@groovenet/client`)
- `packages/groovenet-cli` — publishable CLI (`@groovenet/cli`, bin: `groovenet`)
- `mcp-server` — MCP server (now uses `@groovenet/client`)

### groovenet-client
- `src/types.ts` — Track, Playlist, Friend, Album, TrackSearchQuery, etc.
- `src/schemas.ts` — Zod schemas for external consumers
- `src/client.ts` — `GroovenetClient` class (axios-based, ESM)
- `src/config.ts` — `loadConfig`/`saveConfig` (reads `~/.groovenet/config.json`)
- `src/index.ts` — barrel export
- Build: `npm run build --workspace=packages/groovenet-client`

### groovenet-cli
- Commands: `config`, `tracks`, `playlists`, `play/pause/stop/now-playing`, `friends`, `stats`
- All commands support `--json` for machine-readable output
- `src/output.ts` — chalk/cli-table3 formatters
- Build: `npm run build --workspace=packages/groovenet-cli`
- Link globally: `cd packages/groovenet-cli && npm link`

### Makefile
- `make build-packages` — builds client → CLI → mcp-server in order

### MCP Server
- Uses `GroovenetClient` from `@groovenet/client` instead of raw `apiCall()` + `any` types
- Config: `API_BASE` and `API_KEY` env vars (no ~/.groovenet/config.json — daemon mode)
