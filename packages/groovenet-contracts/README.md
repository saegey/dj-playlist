# @groovenet/contracts

Shared runtime schemas and TypeScript types for Groovenet API resources. It is
the source of truth for the wire enums, entities, and request/response payloads
of live sets (`liveSets.ts`), playlists (`playlists.ts`), tracks (`tracks.ts`)
and albums (`albums.ts`).

## Adding or migrating a contract

1. Define the Zod schema in this package and export its inferred type with
   `z.infer<typeof schema>`.
2. Use the schema in the app route to validate incoming JSON. Keep the route's
   existing HTTP status and error response behavior when adding validation.
3. Import the inferred type in the app's repository/service layer and re-export
   it from `@groovenet/client` when client methods return or accept the resource.
   The CLI consumes client types and does not maintain a parallel declaration.
4. Export JSON Schema forms for OpenAPI components and reference those
   components from the route contract. Add an OpenAPI test for the resource's
   shape and enum values.

Migrate one resource family at a time: live sets, playlists, tracks and albums are
done; the remaining API resources are next. Preserve permissive response fields where
the database returns additional wire fields; make request schemas strict only
when the endpoint already rejects unknown fields.

## Pattern for endpoints with route-specific coercion

Playlist endpoints showed three cases the live-set migration did not need:

- **Text-coerced ids stay in the app.** Path and query ids arrive as strings, so
  the app keeps `intFromInputSchema` for `params`/`query` schemas. The shared
  schema declares the wire type (`id: z.number().int()`); the app derives its
  route schema with `.extend({ id: intFromInputSchema })`. Do not move
  `z.preprocess` into this package: it has no JSON Schema form.
- **Schemas with defaults or refinements publish their input shape.** Pass
  `{ io: "input" }` to `z.toJSONSchema` for those (`PlaylistCreate`,
  `PlaylistSpinsInput`) so OpenAPI documents what a client sends, not what the
  parser produces. Refinements such as "not both `performed_at` and
  `performance_id`" run at runtime but are not expressible in JSON Schema;
  describe them in the route description.
- **Keep the app's schema names as aliases.** `api-contract/schemas.ts` re-exports
  shared schemas under the names routes and `internalApi/*` already import, so a
  migration changes where a schema is defined without touching every caller.

Name wire types after the resource, not the endpoint (`Playlist`,
`PlaylistDetail`, `PlaylistSpinsResult`), and reference them from
`openapi.ts` via the exported `*JsonSchemas` object. Cover new shapes with a
test in this package and an OpenAPI `$ref` assertion in
`my-collection-search/src/api-contract/__tests__/openapi.test.ts`.

## Pattern for large entities (tracks and albums)

Track and album rows carry dozens of database columns, which raised conventions
the smaller resources did not need:

- **Export the entity type from a non-passthrough shape.** `.passthrough()` adds
  an index signature (`[x: string]: unknown`) that collapses `Omit`/`Pick` and
  makes every key `unknown`. Declare `const trackShape = z.object({...})`, export
  `trackSchema = trackShape.passthrough()` for parsing and OpenAPI, and infer
  `TrackEntity` from `trackShape`.
- **The wire schema is honest about nulls; consumers narrow.** `Track` and
  `Album` allow `null` on columns the database can return null for. The app's
  `types/track.ts` narrows the handful of fields its UI never sees null
  (`discogs_url`, `album_thumbnail`, ...) with `Omit<> & {...}` instead of
  loosening the contract.
- **Entities in list/search responses stay opaque at runtime.** The shared
  `TrackSearchResponse` documents `hits` as `Track`, but the search route's
  runtime schema overrides `hits` to `z.array(z.unknown())` because raw SQL rows
  have never been rejected. Do not parse whole entities in a route unless a
  real-database test shows they conform (timestamps and numerics arrive in
  driver-specific types).
- **Query schemas stay in the app.** `trackSearchQuerySchema` and
  `albumSearchQuerySchema` here describe the coerced wire values; the app's
  `*GetQuerySchema` keeps `intFromInputSchema`/`booleanFlagSchema` coercion.
  The client's `trackSearchGetQuerySchema` is still a coercing copy (deferred).
- **Add response validation only to flat payloads.** Routes that return a small
  fixed object (`essentia`, `playlists`, `DELETE`, extract-cover) parse their
  response with the shared schema; lenient request handling (e.g.
  `playlist_counts` silently dropping malformed refs) is preserved.
