# Frontend API Pattern

This project uses a strict client API pattern to keep runtime behavior, typing, and API contracts aligned.

## Rules

1. Define request/response schemas in `src/api-contract/schemas.ts` (Zod is source of truth).
2. Add explicit route contracts in `src/api-contract/routes.ts` for each endpoint.
3. Add client transport methods in `src/services/internalApi/*` using shared helpers from `src/services/http.ts`.
4. Derive input/output types from Zod (`z.input` / `z.infer`) instead of hand-written inline API types.
5. Use `http`, `httpArrayBuffer`, or `streamLines` helpers instead of inline `fetch` in UI/hooks/services.
6. Keep UI components/hooks calling `internalApi/*` methods, not raw endpoints.
7. Remove legacy service/client wrappers once call sites are migrated.

## Implementation Shape

### 1) Schema + Contract

- Add Zod schema(s) in `src/api-contract/schemas.ts`.
- Reference them from a route entry in `src/api-contract/routes.ts`:
  - `querySchema`, `bodySchema`, `successSchema`, `errorSchema`
  - OpenAPI request/response objects in `openapi`.

### 2) Internal API Method

- In `src/services/internalApi/<domain>.ts`:
  - import schema(s)
  - export Zod-derived types:
    - `type FooQuery = z.input<typeof fooQuerySchema>`
    - `type FooResponse = z.infer<typeof fooResponseSchema>`
  - implement method with shared transport:
    - JSON: `http<T>()`
    - binary: `httpArrayBuffer()`
    - streaming lines: `streamLines()`

### 3) Call Site Migration

- Replace inline `fetch` in components/hooks with `internalApi/*` method calls.
- Remove local inline request/response interfaces when schema-derived types exist.
- Update imports to internal API module.

### 4) Cleanup + Verification

- Delete old client/service wrappers if no references remain.
- Validate:
  - `npx eslint <touched files>`
  - `npm run openapi:check`

## Notes

- Keep server-side service/repository types as needed, but frontend transport types should come from Zod schemas.
- For streamed text endpoints, return typed wrappers from `internalApi` (for example `{ lines, message }`) instead of parsing stream logic in UI.
