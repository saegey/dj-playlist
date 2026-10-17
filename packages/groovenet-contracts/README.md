# @groovenet/contracts

Shared runtime schemas and TypeScript types for Groovenet API resources. The
package starts with live sets and is the source of truth for their wire enums,
entities, and update payloads.

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

Migrate one resource family at a time: live sets, playlists, tracks/albums,
then the remaining API resources. Preserve permissive response fields where
the database returns additional wire fields; make request schemas strict only
when the endpoint already rejects unknown fields.
