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
- `reindex-meilisearch.ts` → uses `@/` aliases (works fine)
