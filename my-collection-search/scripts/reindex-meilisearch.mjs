#!/usr/bin/env node

/**
 * Compatibility wrapper for reindexing MeiliSearch.
 * The implementation lives in src/scripts/reindex-meilisearch.ts so it can reuse repository/service modules.
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsx", "src/scripts/reindex-meilisearch.ts", ...process.argv.slice(2)],
  {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
