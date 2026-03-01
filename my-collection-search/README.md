# my-collection-search

## State Ownership

- See [docs/state-ownership.md](docs/state-ownership.md) for the canonical data ownership model:
  - Zustand owns `Track`/`Album` entities
  - React Query owns request lifecycle and lightweight query metadata

## OpenAPI and Swagger docs

- Swagger UI: `http://localhost:3000/api/docs`
- Raw OpenAPI JSON: `http://localhost:3000/api/openapi.json`

### Validate generation

Run:

```bash
npm run openapi:check
```

This script loads `src/api-contract/openapi.ts` and verifies the OpenAPI document can be generated without runtime errors.

### Contract source

API contracts and schemas live in:

- `src/api-contract/schemas.ts`
- `src/api-contract/routes.ts`
- `src/api-contract/openapi.ts`

Route handlers consume these schemas for request validation.
