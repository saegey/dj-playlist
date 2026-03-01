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
- `MEILISEARCH_HOST`
- `MEILISEARCH_API_KEY`
- `REDIS_URL`
- Provider credentials (Apple/Spotify/Discogs/OpenAI) as needed

`DATABASE_URL` is compose-configurable via env and defaults to local docker Postgres when not set.

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
