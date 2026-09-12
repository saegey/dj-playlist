#!/usr/bin/env bash
# Verify every migration applies cleanly on a fresh database, rolls all the way
# back, and re-applies (idempotency). Point DATABASE_URL at an EMPTY, disposable
# Postgres (pgvector) — this drops/recreates the whole schema.
#
# Used by `just migrate-test` (throwaway container) and the migrate-test CI job.
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to a disposable Postgres instance}"

cd "$(dirname "$0")/.."

count=$(find migrations -maxdepth 1 -name '*.js' | wc -l | tr -d ' ')
echo "→ ${count} migrations found"

echo "== UP (all, from empty) =="
npm run migrate -- up

echo "== DOWN (all ${count}) =="
npm run migrate -- down "${count}"

echo "== UP again (idempotency) =="
npm run migrate -- up

echo "✅ migration test passed"
