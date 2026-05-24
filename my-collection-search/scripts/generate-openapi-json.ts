import { getOpenApiDocument } from "../src/api-contract/openapi";
import fs from "node:fs";
import path from "node:path";

const outPath = path.resolve(process.argv[2] ?? "openapi-generated.json");
const doc = getOpenApiDocument();
fs.writeFileSync(outPath, JSON.stringify(doc, null, 2) + "\n");
console.log(`OpenAPI spec written to ${outPath} (${Object.keys(doc.paths).length} paths)`);
