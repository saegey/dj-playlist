#!/bin/sh
# If the schema already exists but pgmigrations is empty, backfill migration
# records so node-pg-migrate doesn't try to re-run already-applied migrations.
set -e

TRACKS_EXISTS=$(psql "$DATABASE_URL" -tAc \
  "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tracks')" \
  2>/dev/null || echo "f")

if [ "$TRACKS_EXISTS" != "t" ]; then
  exit 0
fi

PGMIG_COUNT=$(psql "$DATABASE_URL" -tAc \
  "SELECT COUNT(*) FROM pgmigrations" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$PGMIG_COUNT" != "0" ]; then
  exit 0
fi

echo "Schema exists but pgmigrations is empty — backfilling migration records..."
for f in /app/migrations/*.js; do
  name=$(basename "$f" .js)
  psql "$DATABASE_URL" -c \
    "INSERT INTO pgmigrations (name, run_on) VALUES ('$name', NOW()) ON CONFLICT DO NOTHING" \
    > /dev/null
done
echo "Backfilled $(ls /app/migrations/*.js | wc -l) migration records."

DEFAULT_LIBRARY_TABLE_EXISTS=$(psql "$DATABASE_URL" -tAc \
  "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='default_library_settings')" \
  2>/dev/null | tr -d ' ' || echo "f")

DEFAULT_LIBRARY_MIGRATION_EXISTS=$(psql "$DATABASE_URL" -tAc \
  "SELECT EXISTS(SELECT 1 FROM pgmigrations WHERE name='1772300000001_add-default-library-settings')" \
  2>/dev/null | tr -d ' ' || echo "f")

if [ "$DEFAULT_LIBRARY_TABLE_EXISTS" = "t" ] && [ "$DEFAULT_LIBRARY_MIGRATION_EXISTS" != "t" ]; then
  echo "default_library_settings exists without migration record — backfilling 1772300000001_add-default-library-settings"
  psql "$DATABASE_URL" -c \
    "INSERT INTO pgmigrations (name, run_on) VALUES ('1772300000001_add-default-library-settings', NOW()) ON CONFLICT DO NOTHING" \
    > /dev/null
fi
