# @groovenet/contracts

Shared runtime schemas and TypeScript types for Groovenet API resources. It is
the source of truth for the wire enums, entities, and request/response payloads
of live sets (`liveSets.ts`) and playlists (`playlists.ts`).

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

Migrate one resource family at a time: live sets and playlists are done; tracks
and albums are next, then the remaining API resources. Preserve permissive response fields where
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
