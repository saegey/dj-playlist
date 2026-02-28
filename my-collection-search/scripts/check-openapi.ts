import { getOpenApiDocument } from "../src/api-contract/openapi";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const doc = getOpenApiDocument();

  assert(doc.openapi === "3.1.0", "OpenAPI version must be 3.1.0");
  assert(typeof doc.info?.title === "string", "Missing info.title");
  assert(typeof doc.info?.version === "string", "Missing info.version");
  assert(typeof doc.paths === "object", "Missing paths");

  const pathsCount = Object.keys(doc.paths).length;
  assert(pathsCount > 0, "No paths were generated");

  JSON.stringify(doc);
  console.log(`OpenAPI generated successfully with ${pathsCount} paths.`);
}

main();
