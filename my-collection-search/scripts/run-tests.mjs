#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const testRoots = [
  path.join(projectRoot, "src", "lib", "__tests__"),
  path.join(projectRoot, "src", "providers", "playlist-player", "__tests__"),
];

function collectTests(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTests(full));
    } else if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      files.push(full);
    }
  }
  return files;
}

const tests = testRoots.flatMap(collectTests).sort();

if (tests.length === 0) {
  console.log("No test files found.");
  process.exit(0);
}

let pass = 0;
let fail = 0;

for (const file of tests) {
  const relative = path.relative(projectRoot, file);
  console.log(`=== RUN ${relative} ===`);

  const result = spawnSync("node", ["--import", "tsx/esm", file], {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "test",
    },
  });

  if (result.status === 0) {
    console.log(`=== PASS ${relative} ===\n`);
    pass += 1;
  } else {
    console.log(`=== FAIL ${relative} (exit ${result.status ?? 1}) ===\n`);
    fail += 1;
  }
}

console.log(`TOTAL_PASS=${pass} TOTAL_FAIL=${fail}`);
process.exit(fail > 0 ? 1 : 0);
