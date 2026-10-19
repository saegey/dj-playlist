import { describe, it, expect } from "vitest";
import { getOpenApiDocument } from "../openapi";

type Operation = { tags?: string[]; summary?: string };

function getOperation(path: string, method: string): Operation | undefined {
  const doc = getOpenApiDocument();
  const pathItem = doc.paths[path] as Record<string, Operation> | undefined;
  return pathItem?.[method];
}

// Endpoints that were previously only surfaced via the AutoDiscovered stub and
// now have real contract entries. Auto-discovery silently masks missing
// contracts, so this guards against them regressing to generic stubs.
const CONTRACTED: Array<[method: string, path: string]> = [
  ["get", "/api/tracks/deleted"],
  ["get", "/api/backups"],
  ["get", "/api/backups/{filename}"],
  ["delete", "/api/backups/{filename}"],
  ["post", "/api/restore"],
  ["post", "/api/settings/backup/run"],
  ["get", "/api/health/backup"],
  ["get", "/api/playlists/{id}/set"],
  ["post", "/api/playlists/{id}/set"],
  ["put", "/api/playlists/{id}/set"],
  ["delete", "/api/playlists/{id}/set"],
  // Set derivation (#282).
  ["get", "/api/set-recordings/{sha256}"],
  ["put", "/api/set-recordings/{sha256}"],
  ["post", "/api/set-derivations"],
  ["get", "/api/set-derivations/{id}"],
  ["post", "/api/set-derivations/{id}/claim"],
  ["post", "/api/set-derivations/{id}/result"],
  // Record copies and care (#262).
  ["get", "/api/record-copies"],
  ["post", "/api/record-copies"],
  ["patch", "/api/record-copies/default"],
  ["patch", "/api/record-copies/{id}"],
  ["delete", "/api/record-copies/{id}"],
  ["get", "/api/record-copies/{id}/actions"],
  ["get", "/api/record-copies/care"],
  ["get", "/api/record-copies/care/summary"],
  ["post", "/api/record-actions"],
  ["delete", "/api/record-actions/{id}"],
  // Album artwork (#494).
  ["get", "/api/albums/{releaseId}/artwork"],
  ["put", "/api/albums/{releaseId}/artwork"],
  ["post", "/api/albums/{releaseId}/artwork/preview"],
  ["post", "/api/albums/{releaseId}/artwork/upload"],
  ["post", "/api/albums/{releaseId}/artwork/match"],
  ["post", "/api/albums/artwork/backfill"],
  ["get", "/api/albums/artwork/review"],
];

describe("OpenAPI contract coverage", () => {
  it.each(CONTRACTED)("documents %s %s with a real contract entry", (method, path) => {
    const op = getOperation(path, method);
    expect(op, `${method} ${path} should be present`).toBeTruthy();
    expect(op?.tags ?? [], `${method} ${path} should not be auto-discovered`).not.toContain(
      "AutoDiscovered"
    );
    expect(op?.summary ?? "").not.toMatch(/^Auto-discovered/);
  });

  it("builds a valid 3.1.0 document with a success response for each new path", () => {
    const doc = getOpenApiDocument();
    expect(doc.openapi).toBe("3.1.0");
    for (const [method, path] of CONTRACTED) {
      const op = (doc.paths[path] as Record<string, { responses?: Record<string, unknown> }>)[
        method
      ];
      expect(op.responses, `${method} ${path} responses`).toBeTruthy();
      const codes = Object.keys(op.responses ?? {});
      expect(
        codes.some((code) => code === "200" || code === "201"),
        `${method} ${path} success`
      ).toBe(true);
    }
  });

  it("documents live-set enums and the shared update contract", () => {
    const doc = getOpenApiDocument();
    const schemas = doc.components.schemas as Record<string, { enum?: string[] }>;
    expect(schemas.LiveSetStatus.enum).toEqual(["draft", "performed", "archived"]);
    expect(schemas.LiveSetMediaType.enum).toEqual(["image", "flyer", "audio", "youtube", "link"]);

    const update = getOperation("/api/playlists/{id}/set", "put") as {
      requestBody?: { content?: { "application/json"?: { schema?: { $ref?: string } } } };
    };
    expect(update.requestBody?.content?.["application/json"]?.schema?.$ref)
      .toBe("#/components/schemas/LiveSetUpdate");
  });

  it("references shared playlist components and documents the optimizer modes", () => {
    const doc = getOpenApiDocument();
    const schemas = doc.components.schemas as Record<string, { enum?: string[]; required?: string[] }>;
    expect(schemas.PlaylistOptimizerMode.enum).toEqual(["genetic", "greedy", "cohesive_blocks"]);
    expect(schemas.Playlist.required).toEqual(["id", "name", "created_at", "tracks"]);
    expect(schemas.PlaylistSpinsInput).toBeDefined();

    type Content = { content?: { "application/json"?: { schema?: { $ref?: string } } } };
    const ref = (c?: Content) => c?.content?.["application/json"]?.schema?.$ref;
    const op = (path: string, method: string) =>
      getOperation(path, method) as {
        requestBody?: Content;
        responses: Record<string, Content>;
      };

    expect(ref(op("/api/playlists", "post").requestBody)).toBe("#/components/schemas/PlaylistCreate");
    expect(ref(op("/api/playlists", "post").responses["201"])).toBe("#/components/schemas/Playlist");
    expect(ref(op("/api/playlists", "patch").requestBody)).toBe("#/components/schemas/PlaylistUpdate");
    expect(ref(op("/api/playlists", "delete").responses["200"])).toBe("#/components/schemas/PlaylistDeleteResponse");
    expect(ref(op("/api/playlists/{id}/tracks", "get").responses["200"])).toBe("#/components/schemas/PlaylistDetail");
    expect(ref(op("/api/playlists/{id}/spins", "post").requestBody)).toBe("#/components/schemas/PlaylistSpinsInput");
    expect(ref(op("/api/playlists/{id}/spins", "post").responses["200"])).toBe("#/components/schemas/PlaylistSpinsResult");
    expect(ref(op("/api/playlists/genetic", "post").requestBody)).toBe("#/components/schemas/PlaylistGeneticRequest");
    expect(ref(op("/api/playlists/genetic", "post").responses["400"])).toBe(
      "#/components/schemas/PlaylistGeneticValidationError"
    );
  });

  it("references shared track and album components", () => {
    const doc = getOpenApiDocument();
    const schemas = doc.components.schemas as Record<
      string,
      { enum?: string[]; required?: string[]; additionalProperties?: unknown }
    >;
    expect(schemas.TrackSearchMode.enum).toEqual(["lexical", "semantic", "hybrid"]);
    expect(schemas.AlbumArtSource.enum).toEqual(["discogs", "apple_music", "upload"]);
    expect(schemas.AlbumArtMatchStatus.enum).toEqual(["matched", "mismatch", "no_reference", "no_candidate"]);
    expect(schemas.Track.required).toEqual(["track_id", "friend_id", "title", "artist", "album"]);
    expect(schemas.Album.required).toEqual(["release_id", "friend_id", "title", "artist"]);
    expect(schemas.TrackSearchResponse).toBeDefined();
    expect(schemas.AlbumPlayableStructure).toBeDefined();

    type Content = { content?: { "application/json"?: { schema?: { $ref?: string; items?: { $ref?: string } } } } };
    const op = (path: string, method: string) =>
      getOperation(path, method) as { responses: Record<string, Content> };
    const schemaOf = (c?: Content) => c?.content?.["application/json"]?.schema;

    expect(schemaOf(op("/api/tracks/{id}", "get").responses["200"])).toMatchObject({
      $ref: "#/components/schemas/Track",
    });
    expect(schemaOf(op("/api/albums/{releaseId}/artwork", "get").responses["200"])?.$ref).toBe(
      "#/components/schemas/AlbumArtworkState"
    );
    const search = schemaOf(op("/api/tracks/search", "get").responses["200"]) as unknown as {
      properties?: { hits?: { items?: { $ref?: string } } };
    };
    expect(search?.properties?.hits?.items?.$ref).toBe("#/components/schemas/Track");
  });
});
