# my-collection-search

Next.js app for browsing, searching, and managing a personal DJ track collection.

## Quick start

1. Install dependencies:
```bash
npm install
```
2. Start local services + app (dev):
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```
3. Run migrations:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml run --rm migrate
```

## Compose files

- `docker-compose.yml`: base services/config for all environments
- `docker-compose.dev.yml`: dev overrides (hot reload, source mounts)
- `docker-compose.prod.yml`: production template that extends base services
- `docker-compose.mac.yml`: macOS override (disables `mpd`)
- `docker-compose.airplay.yml`: standalone AirPlay receiver stack

## Useful npm scripts

- `npm run dev`: start Next.js dev server
- `npm run build`: build production app
- `npm run start`: run production app
- `npm run migrate`: run DB migrations (requires `DATABASE_URL`)
- `npm run test`: run tests
- `npm run lint`: run eslint
- `npm run typecheck`: run TypeScript checks

## Key environment variables

- `DATABASE_URL`
- `REDIS_URL`
- Provider credentials (Apple/Discogs/OpenAI) as needed
- `RESTIC_REPOSITORY`, `RESTIC_PASSWORD`, `B2_ACCOUNT_ID`, `B2_ACCOUNT_KEY` (for remote backups)

`DATABASE_URL` is compose-configurable via env and defaults to local docker Postgres when not set.

## Remote Backups (Restic + Backblaze B2)

The app can run scheduled remote backups using policy from `config/backup-policy.yml`.

Required environment variables:
- `RESTIC_REPOSITORY` (B2 format: `b2:<bucket-name>:<path>`)
- `RESTIC_PASSWORD`
- `B2_ACCOUNT_ID`
- `B2_ACCOUNT_KEY`

Example:
```bash
RESTIC_REPOSITORY=b2:groovenet-backups:prod/my-collection-search
RESTIC_PASSWORD=change-this-long-secret
B2_ACCOUNT_ID=0000000000000000000000001
B2_ACCOUNT_KEY=K0000000000000000000000000000000000
```

One-time repository initialization:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec app restic init
```

Optional connectivity check:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec app restic snapshots
```

## State ownership

- See [docs/state-ownership.md](docs/state-ownership.md) for canonical ownership:
  - Zustand owns `Track`/`Album` entities
  - React Query owns request lifecycle and lightweight query metadata
- See [docs/frontend-api-pattern.md](docs/frontend-api-pattern.md) for the frontend API contract/internal API pattern.

## OpenAPI and Swagger docs

- Swagger UI: `http://localhost:3000/api/docs`
- Raw OpenAPI JSON: `http://localhost:3000/api/openapi.json`

Validate generation:

```bash
npm run openapi:check
```

Contract sources:

- `src/api-contract/schemas.ts`
- `src/api-contract/routes.ts`
- `src/api-contract/openapi.ts`
